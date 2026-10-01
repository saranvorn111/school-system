import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import type * as z from "zod";
import { db } from "@/db";
import { attendanceRecords, attendanceSessions, enrollments } from "@/db/schema";
import { invalid } from "@/lib/api/errors";
import { audit } from "@/lib/audit";
import { authorizeSection, can } from "@/lib/auth/authz";
import type { CurrentUser } from "@/lib/auth/current-user";
import { schoolToday } from "@/lib/format";
import { listRoster } from "@/lib/queries";
import type { attendanceSaveSchema } from "@/lib/validation/sections";
import { notify, sectionLabel, userIdsOfStudents } from "./notifications";

/** The attendance sheet of one section on one date, plus recent history. */
export async function getAttendanceSheet(user: CurrentUser, sectionId: number, requestedDate?: string) {
  await authorizeSection(user, "attendance:read", sectionId);
  const today = schoolToday().date;
  const date = requestedDate && requestedDate <= today ? requestedDate : today;

  const [roster, [session], history] = await Promise.all([
    listRoster(sectionId),
    db.select().from(attendanceSessions).where(and(eq(attendanceSessions.sectionId, sectionId), eq(attendanceSessions.date, date))),
    db
      .select({
        date: attendanceSessions.date,
        present: sql<number>`sum(${attendanceRecords.status} = 'present')`.mapWith(Number),
        late: sql<number>`sum(${attendanceRecords.status} = 'late')`.mapWith(Number),
        absent: sql<number>`sum(${attendanceRecords.status} = 'absent')`.mapWith(Number),
        excused: sql<number>`sum(${attendanceRecords.status} = 'excused')`.mapWith(Number),
      })
      .from(attendanceSessions)
      .innerJoin(attendanceRecords, eq(attendanceRecords.attendanceSessionId, attendanceSessions.id))
      .where(eq(attendanceSessions.sectionId, sectionId))
      .groupBy(attendanceSessions.id, attendanceSessions.date)
      .orderBy(desc(attendanceSessions.date))
      .limit(30),
  ]);

  const records = session
    ? await db.select().from(attendanceRecords).where(eq(attendanceRecords.attendanceSessionId, session.id))
    : [];
  const byStudent = new Map(records.map((r) => [r.studentId, r]));
  const taken = !!session;

  return {
    date,
    today,
    taken,
    canSave: !!can(user, "attendance:mark") && (!taken || !!can(user, "attendance:edit")),
    students: roster.map((r) => ({
      studentId: r.studentId,
      code: r.studentCode,
      name: r.fullName,
      status: byStudent.get(r.studentId)?.status ?? null,
      note: byStudent.get(r.studentId)?.note ?? "",
    })),
    history,
  };
}

/**
 * Saves the sheet. Taking attendance needs `attendance:mark`; changing a mark
 * that was already saved needs `attendance:edit` and is audited with before/after.
 */
export async function saveAttendance(user: CurrentUser, sectionId: number, input: z.infer<typeof attendanceSaveSchema>) {
  await authorizeSection(user, "attendance:mark", sectionId);
  const { date } = input;
  if (date > schoolToday().date) throw invalid("You can't take attendance for a future date.");

  const roster = await db
    .select({ studentId: enrollments.studentId })
    .from(enrollments)
    .where(and(eq(enrollments.sectionId, sectionId), eq(enrollments.status, "enrolled")));

  const submitted = new Map(input.records.map((r) => [r.studentId, { status: r.status, note: r.note || null }]));
  // Only enrolled students can be marked, and every one of them must be.
  const missing = roster.filter((r) => !submitted.has(r.studentId)).length;
  if (missing) throw invalid(`Mark every student before saving (${missing} missing).`);
  const marks = new Map(roster.map((r) => [r.studentId, submitted.get(r.studentId)!]));

  const [session] = await db
    .select()
    .from(attendanceSessions)
    .where(and(eq(attendanceSessions.sectionId, sectionId), eq(attendanceSessions.date, date)));
  const existing = session
    ? await db.select().from(attendanceRecords).where(eq(attendanceRecords.attendanceSessionId, session.id))
    : [];
  const before = new Map(existing.map((r) => [r.studentId, r]));

  const changed = [...marks].filter(([studentId, m]) => {
    const prev = before.get(studentId);
    return prev && (prev.status !== m.status || (prev.note ?? null) !== m.note);
  });
  if (changed.length) await authorizeSection(user, "attendance:edit", sectionId);

  await db.transaction(async (tx) => {
    let sessionId = session?.id;
    if (!sessionId) {
      [{ id: sessionId }] = await tx.insert(attendanceSessions).values({ sectionId, date, startedById: user.id }).$returningId();
    }
    for (const [studentId, m] of marks) {
      await tx
        .insert(attendanceRecords)
        .values({ attendanceSessionId: sessionId, studentId, status: m.status, note: m.note, markedById: user.id })
        .onDuplicateKeyUpdate({ set: { status: m.status, note: m.note, markedById: user.id } });
    }

    if (!session) {
      await audit(
        { actorUserId: user.id, action: "attendance.taken", entityType: "attendance_session", entityId: sessionId, after: { sectionId, date, count: marks.size } },
        tx,
      );
    } else if (changed.length) {
      await audit(
        {
          actorUserId: user.id,
          action: "attendance.edited",
          entityType: "attendance_session",
          entityId: sessionId,
          before: Object.fromEntries(changed.map(([sid]) => [sid, before.get(sid)!.status])),
          after: Object.fromEntries(changed.map(([sid, m]) => [sid, m.status])),
        },
        tx,
      );
    }

    // Tell students who were newly marked absent or late.
    const flagged = [...marks]
      .filter(([sid, m]) => (m.status === "absent" || m.status === "late") && before.get(sid)?.status !== m.status)
      .map(([sid, m]) => ({ sid, status: m.status }));
    if (flagged.length) {
      const label = await sectionLabel(sectionId);
      for (const status of ["absent", "late"] as const) {
        const ids = flagged.filter((f) => f.status === status).map((f) => f.sid);
        await notify(
          await userIdsOfStudents(ids),
          { type: `attendance.${status}`, title: `You were marked ${status} in ${label}`, body: date, href: "/student/attendance" },
          tx,
        );
      }
    }
  });

  return {
    message: session ? (changed.length ? `Attendance updated (${changed.length} change(s)).` : "No changes.") : "Attendance saved.",
  };
}
