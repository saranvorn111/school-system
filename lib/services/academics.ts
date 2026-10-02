import "server-only";
import { asc, desc, eq, sql, type SQL } from "drizzle-orm";
import type { MySqlTable } from "drizzle-orm/mysql-core";
import type * as z from "zod";
import { db, isDuplicateKeyError } from "@/db";
import { academicYears, courses, departments, programs, sections, students, teachers, terms } from "@/db/schema";
import { conflict, notFound } from "@/lib/api/errors";
import { audit } from "@/lib/audit";
import { authorize } from "@/lib/auth/authz";
import type { CurrentUser } from "@/lib/auth/current-user";
import type { Permission } from "@/lib/auth/permissions";
import { listDepartments, listPrograms, listTerms } from "@/lib/queries";
import type { academicYearSchema, courseSchema, departmentSchema, programSchema, termSchema } from "@/lib/validation/academics";

/** Shared shape of a simple create: permission → insert → audit, with a friendly duplicate message. */
async function createRecord(
  user: CurrentUser,
  permission: Permission,
  entityType: string,
  data: object,
  insert: () => Promise<number>,
  duplicateMessage: string,
) {
  await authorize(user, permission, { global: true });
  try {
    const id = await insert();
    await audit({ actorUserId: user.id, action: `${entityType}.created`, entityType, entityId: id, after: data });
    return { id };
  } catch (e) {
    if (isDuplicateKeyError(e)) throw conflict(duplicateMessage);
    throw e;
  }
}

// ── Departments & programs ─────────────────────────────────────

export async function getDepartments(user: CurrentUser) {
  await authorize(user, "organization:manage", { global: true });
  return listDepartments();
}

export function createDepartment(user: CurrentUser, data: z.infer<typeof departmentSchema>) {
  return createRecord(user, "organization:manage", "department", data,
    async () => (await db.insert(departments).values(data).$returningId())[0].id,
    "A department with that code already exists.");
}

export async function getPrograms(user: CurrentUser) {
  await authorize(user, "organization:manage", { global: true });
  return listPrograms();
}

export function createProgram(user: CurrentUser, data: z.infer<typeof programSchema>) {
  return createRecord(user, "organization:manage", "program", data,
    async () => (await db.insert(programs).values(data).$returningId())[0].id,
    "A program with that code already exists.");
}

// ── Academic years & terms ─────────────────────────────────────

export async function getAcademicYears(user: CurrentUser) {
  await authorize(user, "academic:manage", { global: true });
  return db.select().from(academicYears).orderBy(desc(academicYears.startDate));
}

export function createAcademicYear(user: CurrentUser, data: z.infer<typeof academicYearSchema>) {
  return createRecord(user, "academic:manage", "academic_year", data,
    async () => (await db.insert(academicYears).values(data).$returningId())[0].id,
    "That academic year already exists.");
}

/** Terms are needed to pick a term on several screens, so any signed-in user may list them. */
export async function getTerms() {
  return listTerms();
}

export function createTerm(user: CurrentUser, data: z.infer<typeof termSchema>) {
  return createRecord(user, "academic:manage", "term", data,
    async () => (await db.insert(terms).values(data).$returningId())[0].id,
    "That term already exists in this academic year.");
}

export async function setCurrentTerm(user: CurrentUser, termId: number) {
  await authorize(user, "academic:manage", { global: true });
  const [term] = await db.select({ id: terms.id }).from(terms).where(eq(terms.id, termId));
  if (!term) throw notFound("Term not found.");
  await db.transaction(async (tx) => {
    await tx.update(terms).set({ isCurrent: false }).where(eq(terms.isCurrent, true));
    await tx.update(terms).set({ isCurrent: true }).where(eq(terms.id, termId));
    await audit({ actorUserId: user.id, action: "term.set_current", entityType: "term", entityId: termId }, tx);
  });
}

// ── Courses ────────────────────────────────────────────────────

export async function getCourses(user: CurrentUser) {
  await authorize(user, "course:read");
  return db
    .select({
      id: courses.id,
      code: courses.code,
      title: courses.title,
      credits: courses.credits,
      departmentId: courses.departmentId,
      department: departments.name,
      description: courses.description,
    })
    .from(courses)
    .leftJoin(departments, eq(departments.id, courses.departmentId))
    .orderBy(asc(courses.code));
}

export function createCourse(user: CurrentUser, data: z.infer<typeof courseSchema>) {
  return createRecord(user, "course:create", "course", data,
    async () => (await db.insert(courses).values(data).$returningId())[0].id,
    "A course with that code already exists.");
}

// ── Edit and delete ────────────────────────────────────────────

/** Permission → update → audit with before/after, with a friendly duplicate message. */
async function updateRecord(
  user: CurrentUser,
  permission: Permission,
  entityType: string,
  id: number,
  data: object,
  load: () => Promise<object | undefined>,
  update: () => Promise<unknown>,
  duplicateMessage: string,
) {
  await authorize(user, permission, { global: true });
  const before = await load();
  if (!before) throw notFound("Record not found.");
  try {
    await update();
  } catch (e) {
    if (isDuplicateKeyError(e)) throw conflict(duplicateMessage);
    throw e;
  }
  await audit({ actorUserId: user.id, action: `${entityType}.updated`, entityType, entityId: id, before, after: data });
}

const countWhere = async (table: MySqlTable, where: SQL) =>
  (await db.select({ n: sql<number>`count(*)`.mapWith(Number) }).from(table).where(where))[0].n;

/**
 * Permission → refuse while other records still point at this one → delete → audit.
 * `usedBy` lists what blocks the delete, e.g. { "program(s)": 2, "course(s)": 0 }.
 */
async function deleteRecord(
  user: CurrentUser,
  permission: Permission,
  entityType: string,
  id: number,
  load: () => Promise<object | undefined>,
  usedBy: () => Promise<Record<string, number>>,
  remove: () => Promise<unknown>,
) {
  await authorize(user, permission, { global: true });
  const before = await load();
  if (!before) throw notFound("Record not found.");

  const blockers = Object.entries(await usedBy()).filter(([, n]) => n > 0);
  if (blockers.length) {
    const list = blockers.map(([what, n]) => `${n} ${what}`).join(", ");
    throw conflict(`This can't be deleted because it is still used by ${list}. Move or remove those first.`);
  }
  await remove();
  await audit({ actorUserId: user.id, action: `${entityType}.deleted`, entityType, entityId: id, before });
}

const one = async <T>(rows: Promise<T[]>) => (await rows)[0];

export function updateDepartment(user: CurrentUser, id: number, data: z.infer<typeof departmentSchema>) {
  return updateRecord(user, "organization:manage", "department", id, data,
    () => one(db.select().from(departments).where(eq(departments.id, id))),
    () => db.update(departments).set(data).where(eq(departments.id, id)),
    "A department with that code already exists.");
}

export function deleteDepartment(user: CurrentUser, id: number) {
  return deleteRecord(user, "organization:manage", "department", id,
    () => one(db.select().from(departments).where(eq(departments.id, id))),
    async () => ({
      "program(s)": await countWhere(programs, eq(programs.departmentId, id)),
      "teacher(s)": await countWhere(teachers, eq(teachers.departmentId, id)),
      "course(s)": await countWhere(courses, eq(courses.departmentId, id)),
    }),
    () => db.delete(departments).where(eq(departments.id, id)));
}

export function updateProgram(user: CurrentUser, id: number, data: z.infer<typeof programSchema>) {
  return updateRecord(user, "organization:manage", "program", id, data,
    () => one(db.select().from(programs).where(eq(programs.id, id))),
    () => db.update(programs).set(data).where(eq(programs.id, id)),
    "A program with that code already exists.");
}

export function deleteProgram(user: CurrentUser, id: number) {
  return deleteRecord(user, "organization:manage", "program", id,
    () => one(db.select().from(programs).where(eq(programs.id, id))),
    async () => ({ "student(s)": await countWhere(students, eq(students.programId, id)) }),
    () => db.delete(programs).where(eq(programs.id, id)));
}

export function updateAcademicYear(user: CurrentUser, id: number, data: z.infer<typeof academicYearSchema>) {
  return updateRecord(user, "academic:manage", "academic_year", id, data,
    () => one(db.select().from(academicYears).where(eq(academicYears.id, id))),
    () => db.update(academicYears).set(data).where(eq(academicYears.id, id)),
    "That academic year already exists.");
}

export function deleteAcademicYear(user: CurrentUser, id: number) {
  return deleteRecord(user, "academic:manage", "academic_year", id,
    () => one(db.select().from(academicYears).where(eq(academicYears.id, id))),
    async () => ({ "term(s)": await countWhere(terms, eq(terms.academicYearId, id)) }),
    () => db.delete(academicYears).where(eq(academicYears.id, id)));
}

export function updateTerm(user: CurrentUser, id: number, data: z.infer<typeof termSchema>) {
  return updateRecord(user, "academic:manage", "term", id, data,
    () => one(db.select().from(terms).where(eq(terms.id, id))),
    () => db.update(terms).set(data).where(eq(terms.id, id)),
    "That term already exists in this academic year.");
}

export function deleteTerm(user: CurrentUser, id: number) {
  return deleteRecord(user, "academic:manage", "term", id,
    () => one(db.select().from(terms).where(eq(terms.id, id))),
    async () => ({ "section(s)": await countWhere(sections, eq(sections.termId, id)) }),
    () => db.delete(terms).where(eq(terms.id, id)));
}

export function updateCourse(user: CurrentUser, id: number, data: z.infer<typeof courseSchema>) {
  // Clearing an optional field in the form must clear it in the database too.
  const values = { ...data, departmentId: data.departmentId ?? null, description: data.description ?? null };
  return updateRecord(user, "course:update", "course", id, values,
    () => one(db.select().from(courses).where(eq(courses.id, id))),
    () => db.update(courses).set(values).where(eq(courses.id, id)),
    "A course with that code already exists.");
}

export function deleteCourse(user: CurrentUser, id: number) {
  return deleteRecord(user, "course:delete", "course", id,
    () => one(db.select().from(courses).where(eq(courses.id, id))),
    async () => ({ "section(s)": await countWhere(sections, eq(sections.courseId, id)) }),
    () => db.delete(courses).where(eq(courses.id, id)));
}
