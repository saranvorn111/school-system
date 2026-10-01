import "server-only";
import { and, asc, eq, inArray, ne, notInArray, sql, type SQL } from "drizzle-orm";
import type * as z from "zod";
import { db, isDuplicateKeyError, type Tx } from "@/db";
import { courses, enrollments, sections, students, users } from "@/db/schema";
import { conflict, forbidden, notFound } from "@/lib/api/errors";
import { audit } from "@/lib/audit";
import { authorize, authorizeSection, can } from "@/lib/auth/authz";
import type { CurrentUser } from "@/lib/auth/current-user";
import { formatSchedule } from "@/lib/format";
import { getCurrentTerm, getSectionDetail, listRoster, listSections, listTeacherOptions } from "@/lib/queries";
import { slotsOverlap, type Slot } from "@/lib/schedule";
import { sectionScopeFilter } from "@/lib/scoped";
import type { sectionSchema } from "@/lib/validation/sections";
import { notify, sectionLabel, userIdOfTeacher, userIdsOfStudents } from "./notifications";

/** Sections of a term the user may see (all for admins, own classes for teachers). */
export async function getSections(user: CurrentUser, termId?: number) {
  const scope = await authorize(user, "section:read");
  if (scope === "own") throw forbidden("Students see their classes in their timetable.");
  const term = termId ? { id: termId } : await getCurrentTerm();
  if (!term) return [];
  return listSections(and(eq(sections.termId, term.id), sectionScopeFilter(user, scope)));
}

export async function getSection(user: CurrentUser, id: number) {
  const { scope } = await authorizeSection(user, "section:read", id);
  const [section, roster] = await Promise.all([getSectionDetail(id), listRoster(id)]);
  if (!section) throw notFound("Section not found.");
  // Scores are only shown to people who may read grades for this section.
  const showScores = !!can(user, "grade:read");
  return {
    section,
    roster: roster.map((r) => (showScores ? r : { ...r, score: null, letter: null, gradePoint: null })),
    scope,
    canManage: scope === "global",
  };
}

/** Active students who are not enrolled in the section yet (for the enroll picker). */
export async function getAvailableStudents(user: CurrentUser, sectionId: number) {
  await authorize(user, "enrollment:create", { global: true });
  return db
    .select({ id: students.id, code: students.studentCode, name: users.fullName })
    .from(students)
    .innerJoin(users, eq(users.id, students.userId))
    .where(
      and(
        eq(students.status, "active"),
        notInArray(
          students.id,
          db
            .select({ id: enrollments.studentId })
            .from(enrollments)
            .where(and(eq(enrollments.sectionId, sectionId), eq(enrollments.status, "enrolled"))),
        ),
      ),
    )
    .orderBy(asc(students.studentCode));
}

export async function getTeacherOptions(user: CurrentUser) {
  await authorize(user, "section:assign_teacher", { global: true });
  return listTeacherOptions();
}

export async function getPendingGradeSections(user: CurrentUser) {
  await authorize(user, "grade:approve", { global: true });
  return listSections(inArray(sections.gradeStatus, ["submitted", "approved"]));
}

// ── Timetable clash rules ──────────────────────────────────────

/** First section in the same term that matches `filter` and overlaps `slot`, if any. */
async function findClash(tx: Tx, termId: number, slot: Slot, filter: SQL, excludeSectionId?: number) {
  const candidates = await tx
    .select({
      id: sections.id,
      dayOfWeek: sections.dayOfWeek,
      startTime: sections.startTime,
      endTime: sections.endTime,
      label: sql<string>`concat(${courses.code}, '-', ${sections.sectionCode})`,
    })
    .from(sections)
    .innerJoin(courses, eq(courses.id, sections.courseId))
    .where(
      and(
        eq(sections.termId, termId),
        eq(sections.dayOfWeek, slot.dayOfWeek),
        excludeSectionId ? ne(sections.id, excludeSectionId) : undefined,
        filter,
      ),
    );
  return candidates.find((c) => slotsOverlap(c, slot)) ?? null;
}

const clash = (who: string, c: { label: string } & Slot) => conflict(`${who} already has ${c.label} at ${formatSchedule(c)}.`);

// ── Mutations ──────────────────────────────────────────────────

export async function createSection(user: CurrentUser, data: z.infer<typeof sectionSchema>) {
  await authorize(user, "section:create", { global: true });
  if (data.teacherId) await authorize(user, "section:assign_teacher", { global: true });

  try {
    return await db.transaction(async (tx) => {
      if (data.teacherId) {
        const c = await findClash(tx, data.termId, data, eq(sections.teacherId, data.teacherId));
        if (c) throw clash("This teacher", c);
      }
      if (data.room) {
        const c = await findClash(tx, data.termId, data, eq(sections.room, data.room));
        if (c) throw clash(`Room ${data.room}`, c);
      }
      const [{ id }] = await tx.insert(sections).values(data).$returningId();
      await audit({ actorUserId: user.id, action: "section.created", entityType: "section", entityId: id, after: data }, tx);
      return { id };
    });
  } catch (e) {
    if (isDuplicateKeyError(e)) throw conflict("This course already has a section with that code in this term.");
    throw e;
  }
}

export async function assignTeacher(user: CurrentUser, sectionId: number, teacherId: number | null) {
  await authorize(user, "section:assign_teacher", { global: true });
  await db.transaction(async (tx) => {
    const [section] = await tx.select().from(sections).where(eq(sections.id, sectionId));
    if (!section) throw notFound("Section not found.");
    if (teacherId) {
      const c = await findClash(tx, section.termId, section, eq(sections.teacherId, teacherId), section.id);
      if (c) throw clash("This teacher", c);
    }
    await tx.update(sections).set({ teacherId }).where(eq(sections.id, section.id));
    await audit(
      {
        actorUserId: user.id,
        action: "section.teacher_assigned",
        entityType: "section",
        entityId: section.id,
        before: { teacherId: section.teacherId },
        after: { teacherId },
      },
      tx,
    );
    await notify(
      await userIdOfTeacher(teacherId),
      { type: "section.assigned", title: `You were assigned to teach ${await sectionLabel(sectionId)}`, href: `/teacher/sections/${sectionId}` },
      tx,
    );
  });
}

export async function enrollStudent(user: CurrentUser, sectionId: number, studentId: number) {
  await authorize(user, "enrollment:create", { global: true });

  return db.transaction(async (tx) => {
    // Lock the section row so two admins can't both take the last seat.
    const [section] = await tx.select().from(sections).where(eq(sections.id, sectionId)).for("update");
    if (!section) throw notFound("Section not found.");
    if (section.gradeStatus !== "draft") throw conflict("Grades for this section are already submitted; enrollment is closed.");

    const [student] = await tx
      .select({ id: students.id, userId: students.userId, status: students.status, name: users.fullName })
      .from(students)
      .innerJoin(users, eq(users.id, students.userId))
      .where(eq(students.id, studentId));
    if (!student) throw notFound("Student not found.");
    if (student.status !== "active") throw conflict(`${student.name} is ${student.status} and can't be enrolled.`);

    const [{ count }] = await tx
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(enrollments)
      .where(and(eq(enrollments.sectionId, section.id), eq(enrollments.status, "enrolled")));
    if (count >= section.capacity) throw conflict(`The section is full (${section.capacity} seats).`);

    const [existing] = await tx
      .select()
      .from(enrollments)
      .where(and(eq(enrollments.sectionId, section.id), eq(enrollments.studentId, student.id)));
    if (existing?.status === "enrolled") throw conflict(`${student.name} is already enrolled.`);

    const theirSections = inArray(
      sections.id,
      tx
        .select({ id: enrollments.sectionId })
        .from(enrollments)
        .where(and(eq(enrollments.studentId, student.id), eq(enrollments.status, "enrolled"))),
    );
    const c = await findClash(tx, section.termId, section, theirSections, section.id);
    if (c) throw clash(student.name, c);

    let enrollmentId: number;
    if (existing) {
      await tx.update(enrollments).set({ status: "enrolled" }).where(eq(enrollments.id, existing.id));
      enrollmentId = existing.id;
    } else {
      [{ id: enrollmentId }] = await tx.insert(enrollments).values({ sectionId: section.id, studentId: student.id }).$returningId();
    }
    await audit(
      { actorUserId: user.id, action: "enrollment.created", entityType: "enrollment", entityId: enrollmentId, after: { sectionId, studentId } },
      tx,
    );
    await notify(
      [student.userId],
      { type: "enrollment.created", title: `You were enrolled in ${await sectionLabel(sectionId)}`, href: "/student/timetable" },
      tx,
    );
    return { id: enrollmentId, message: `${student.name} enrolled.` };
  });
}

export async function dropEnrollment(user: CurrentUser, enrollmentId: number) {
  await authorize(user, "enrollment:cancel", { global: true });
  const [row] = await db
    .select({ enrollment: enrollments, gradeStatus: sections.gradeStatus })
    .from(enrollments)
    .innerJoin(sections, eq(sections.id, enrollments.sectionId))
    .where(eq(enrollments.id, enrollmentId));
  if (!row) throw notFound("Enrollment not found.");
  if (row.gradeStatus !== "draft") throw conflict("Grades are already submitted for this section; the student can't be dropped.");

  await db.update(enrollments).set({ status: "dropped" }).where(eq(enrollments.id, enrollmentId));
  await audit({
    actorUserId: user.id,
    action: "enrollment.dropped",
    entityType: "enrollment",
    entityId: enrollmentId,
    before: { status: row.enrollment.status },
    after: { status: "dropped" },
  });
  await notify(await userIdsOfStudents([row.enrollment.studentId]), {
    type: "enrollment.dropped",
    title: `You were dropped from ${await sectionLabel(row.enrollment.sectionId)}`,
    href: "/student/timetable",
  });
}
