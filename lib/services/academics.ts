import "server-only";
import { asc, desc, eq } from "drizzle-orm";
import type * as z from "zod";
import { db, isDuplicateKeyError } from "@/db";
import { academicYears, courses, departments, programs, terms } from "@/db/schema";
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
    .select({ id: courses.id, code: courses.code, title: courses.title, credits: courses.credits, department: departments.name })
    .from(courses)
    .leftJoin(departments, eq(departments.id, courses.departmentId))
    .orderBy(asc(courses.code));
}

export function createCourse(user: CurrentUser, data: z.infer<typeof courseSchema>) {
  return createRecord(user, "course:create", "course", data,
    async () => (await db.insert(courses).values(data).$returningId())[0].id,
    "A course with that code already exists.");
}
