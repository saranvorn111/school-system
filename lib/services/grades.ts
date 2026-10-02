import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import type * as z from "zod";
import { db } from "@/db";
import { enrollments, grades, sections, type GradeStatus } from "@/db/schema";
import { conflict, forbidden, invalid } from "@/lib/api/errors";
import { audit } from "@/lib/audit";
import { authorizeSection, can } from "@/lib/auth/authz";
import type { CurrentUser } from "@/lib/auth/current-user";
import type { Permission } from "@/lib/auth/permissions";
import { scoreToGrade } from "@/lib/grading";
import { getSectionDetail, listRoster } from "@/lib/queries";
import { notify, sectionLabel, userIdOfTeacher, userIdsEnrolledIn, userIdsWithPermission } from "./notifications";
import type { gradesSaveSchema } from "@/lib/validation/sections";

/*
 * Grade workflow (requirements section 11):
 *
 *   draft ──submit──▶ submitted ──approve──▶ approved ──publish──▶ published
 *     ▲                   │                     │
 *     └──────reject───────┴─────────────────────┘
 *     ▲
 *     └──────reopen (correction, needs a reason)──────────────────── published
 *
 * Teachers can only edit in `draft`. Students only see `published` grades.
 */

export async function getGradeSheet(user: CurrentUser, sectionId: number) {
  const { section } = await authorizeSection(user, "grade:read", sectionId);
  const roster = await listRoster(sectionId);
  return {
    status: section.gradeStatus,
    reviewNote: section.gradeReviewNote,
    canEdit: section.gradeStatus === "draft" && !!can(user, "grade:enter"),
    canSubmit: section.gradeStatus === "draft" && !!can(user, "grade:submit"),
    canApprove: can(user, "grade:approve") === "global",
    canPublish: can(user, "grade:publish") === "global",
    rows: roster.map((r) => ({ enrollmentId: r.enrollmentId, code: r.studentCode, name: r.fullName, score: r.score, letter: r.letter })),
  };
}

export async function saveGrades(user: CurrentUser, sectionId: number, input: z.infer<typeof gradesSaveSchema>) {
  const { section } = await authorizeSection(user, "grade:enter", sectionId);
  if (section.gradeStatus !== "draft") throw conflict("Grades are locked while they are being reviewed or after publishing.");

  const roster = await db
    .select({ enrollmentId: enrollments.id, score: grades.score })
    .from(enrollments)
    .leftJoin(grades, eq(grades.enrollmentId, enrollments.id))
    .where(and(eq(enrollments.sectionId, sectionId), eq(enrollments.status, "enrolled")));
  const current = new Map(roster.map((r) => [r.enrollmentId, r.score]));

  const upserts: { enrollmentId: number; score: number; before: number | null }[] = [];
  const removals: { enrollmentId: number; before: number }[] = [];
  for (const { enrollmentId, score } of input.scores) {
    // Ignore ids that don't belong to this section: a teacher can't grade other classes through this endpoint.
    if (!current.has(enrollmentId)) continue;
    const before = current.get(enrollmentId) ?? null;
    if (score === null) {
      if (before !== null) removals.push({ enrollmentId, before });
      continue;
    }
    const rounded = Math.round(score * 100) / 100;
    if (before !== rounded) upserts.push({ enrollmentId, score: rounded, before });
  }
  if (!upserts.length && !removals.length) return { message: "No changes." };

  await db.transaction(async (tx) => {
    for (const u of upserts) {
      const { letter, point } = scoreToGrade(u.score);
      await tx
        .insert(grades)
        .values({ enrollmentId: u.enrollmentId, score: u.score, letter, gradePoint: point, updatedById: user.id })
        .onDuplicateKeyUpdate({ set: { score: u.score, letter, gradePoint: point, updatedById: user.id } });
    }
    if (removals.length) {
      await tx.delete(grades).where(inArray(grades.enrollmentId, removals.map((r) => r.enrollmentId)));
    }
    await audit(
      {
        actorUserId: user.id,
        action: "grade.saved",
        entityType: "section",
        entityId: sectionId,
        before: Object.fromEntries([...upserts, ...removals].map((c) => [`enrollment:${c.enrollmentId}`, c.before])),
        after: Object.fromEntries([
          ...upserts.map((u) => [`enrollment:${u.enrollmentId}`, u.score]),
          ...removals.map((r) => [`enrollment:${r.enrollmentId}`, null]),
        ]),
      },
      tx,
    );
  });
  return { message: `Saved ${upserts.length + removals.length} change(s).` };
}

/** Moves a section's grades from one workflow state to the next, atomically. */
async function transition(
  user: CurrentUser,
  sectionId: number,
  permission: Permission,
  from: GradeStatus[],
  to: GradeStatus,
  action: string,
  note?: string,
  check?: () => Promise<void>,
) {
  const { section, scope } = await authorizeSection(user, permission, sectionId);
  // Reviewing grades is an institution-level decision, never a teacher's own-class one.
  if ((permission === "grade:approve" || permission === "grade:publish") && scope !== "global") {
    throw forbidden("Only reviewers can do this.");
  }
  if (!from.includes(section.gradeStatus)) throw conflict(`Grades are "${section.gradeStatus}" — this step isn't available.`);
  if (to === "draft" && !note) throw invalid("Give a reason so the teacher knows what to fix.", { note: ["Required."] });
  await check?.();

  // The WHERE on the old status makes this safe if two people click at the same time.
  const [result] = await db
    .update(sections)
    .set({ gradeStatus: to, gradeReviewNote: to === "draft" ? note : null })
    .where(and(eq(sections.id, sectionId), eq(sections.gradeStatus, section.gradeStatus)));
  if (result.affectedRows === 0) throw conflict("Someone else changed these grades. Reload and try again.");

  await audit({
    actorUserId: user.id,
    action,
    entityType: "section",
    entityId: sectionId,
    before: { gradeStatus: section.gradeStatus },
    after: { gradeStatus: to },
    reason: note,
  });
  return { status: to, message: `Grades are now ${to}.` };
}

export async function submitGrades(user: CurrentUser, sectionId: number) {
  const result = await transition(user, sectionId, "grade:submit", ["draft"], "submitted", "grade.submitted", undefined, async () => {
    const rows = await db
      .select({ grade: grades.id })
      .from(enrollments)
      .leftJoin(grades, eq(grades.enrollmentId, enrollments.id))
      .where(and(eq(enrollments.sectionId, sectionId), eq(enrollments.status, "enrolled")));
    if (rows.length === 0) throw conflict("There are no students to grade.");
    const missing = rows.filter((r) => r.grade === null).length;
    if (missing) throw conflict(`${missing} student(s) still have no score. Enter all scores before submitting.`);
  });
  const label = await sectionLabel(sectionId);
  await notify(await userIdsWithPermission("grade:approve"), {
    type: "grade.submitted",
    title: `Grades submitted: ${label}`,
    body: `${user.fullName} submitted grades for review.`,
    href: `/admin/sections/${sectionId}`,
  });
  return result;
}

export async function approveGrades(user: CurrentUser, sectionId: number) {
  const result = await transition(user, sectionId, "grade:approve", ["submitted"], "approved", "grade.approved");
  const section = await getSectionDetail(sectionId);
  await notify(await userIdOfTeacher(section?.teacherId ?? null), {
    type: "grade.approved",
    title: `Grades approved: ${await sectionLabel(sectionId)}`,
    body: "They will be visible to students once published.",
    href: `/teacher/sections/${sectionId}/grades`,
  });
  return result;
}

export async function rejectGrades(user: CurrentUser, sectionId: number, note?: string) {
  const result = await transition(user, sectionId, "grade:approve", ["submitted", "approved"], "draft", "grade.rejected", note);
  const section = await getSectionDetail(sectionId);
  await notify(await userIdOfTeacher(section?.teacherId ?? null), {
    type: "grade.rejected",
    title: `Grades sent back: ${await sectionLabel(sectionId)}`,
    body: note,
    href: `/teacher/sections/${sectionId}/grades`,
  });
  return result;
}

export async function publishGrades(user: CurrentUser, sectionId: number) {
  const result = await transition(user, sectionId, "grade:publish", ["approved"], "published", "grade.published");
  await notify(await userIdsEnrolledIn(sectionId), {
    type: "grade.published",
    title: `Your grade is published: ${await sectionLabel(sectionId)}`,
    href: "/student/grades",
  });
  return result;
}

/**
 * Correction path for published grades: back to draft so the teacher can fix a
 * score. Students stop seeing the grade until it is published again. A reason
 * is required and recorded in the audit log.
 */
export async function reopenGrades(user: CurrentUser, sectionId: number, note?: string) {
  const result = await transition(user, sectionId, "grade:publish", ["published"], "draft", "grade.reopened", note);
  const [section, label] = await Promise.all([getSectionDetail(sectionId), sectionLabel(sectionId)]);
  await notify(await userIdOfTeacher(section?.teacherId ?? null), {
    type: "grade.reopened",
    title: `Grades reopened for correction: ${label}`,
    body: note,
    href: `/teacher/sections/${sectionId}/grades`,
  });
  await notify(await userIdsEnrolledIn(sectionId), {
    type: "grade.reopened",
    title: `Your grade for ${label} is being corrected`,
    body: "It will appear again once it is republished.",
    href: "/student/grades",
  });
  return result;
}
