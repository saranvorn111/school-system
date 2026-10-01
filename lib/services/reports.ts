import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { attendanceRecords, attendanceSessions, courses, enrollments, grades, sections, students, users } from "@/db/schema";
import { authorize } from "@/lib/auth/authz";
import type { CurrentUser } from "@/lib/auth/current-user";
import { getCurrentTerm, listSections } from "@/lib/queries";

const AT_RISK_ATTENDANCE = 80; // percent
const PASS_SCORE = 50; // lowest "C" on the grading scale

const num = (expr: ReturnType<typeof sql>) => sql<number>`${expr}`.mapWith(Number);
const percent = (part: number, total: number) => (total ? Math.round((part / total) * 100) : null);

/**
 * One term at a glance: seats, attendance and grade results per section, and
 * students whose attendance is below the threshold.
 */
export async function termReport(user: CurrentUser, termId?: number) {
  await authorize(user, "report:read", { global: true });
  const term = termId ? { id: termId } : await getCurrentTerm();
  if (!term) return { termId: null, sections: [], atRisk: [], totals: null };

  const inTerm = eq(sections.termId, term.id);
  const attended = sql`sum(${attendanceRecords.status} in ('present','late'))`;

  const [sectionRows, attendanceRows, gradeRows, studentAttendance] = await Promise.all([
    listSections(inTerm),
    db
      .select({
        sectionId: attendanceSessions.sectionId,
        sessions: num(sql`count(distinct ${attendanceSessions.id})`),
        attended: num(attended),
        total: num(sql`count(*)`),
      })
      .from(attendanceRecords)
      .innerJoin(attendanceSessions, eq(attendanceSessions.id, attendanceRecords.attendanceSessionId))
      .innerJoin(sections, eq(sections.id, attendanceSessions.sectionId))
      .where(inTerm)
      .groupBy(attendanceSessions.sectionId),
    db
      .select({
        sectionId: enrollments.sectionId,
        graded: num(sql`count(*)`),
        average: num(sql`avg(${grades.score})`),
        passed: num(sql`sum(${grades.score} >= ${PASS_SCORE})`),
      })
      .from(grades)
      .innerJoin(enrollments, eq(enrollments.id, grades.enrollmentId))
      .innerJoin(sections, eq(sections.id, enrollments.sectionId))
      .where(and(inTerm, eq(enrollments.status, "enrolled")))
      .groupBy(enrollments.sectionId),
    db
      .select({
        studentId: students.id,
        studentCode: students.studentCode,
        name: users.fullName,
        section: sql<string>`concat(${courses.code}, '-', ${sections.sectionCode})`,
        attended: num(attended),
        absent: num(sql`sum(${attendanceRecords.status} = 'absent')`),
        total: num(sql`count(*)`),
      })
      .from(attendanceRecords)
      .innerJoin(attendanceSessions, eq(attendanceSessions.id, attendanceRecords.attendanceSessionId))
      .innerJoin(sections, eq(sections.id, attendanceSessions.sectionId))
      .innerJoin(courses, eq(courses.id, sections.courseId))
      .innerJoin(students, eq(students.id, attendanceRecords.studentId))
      .innerJoin(users, eq(users.id, students.userId))
      .where(inTerm)
      .groupBy(students.id, students.studentCode, users.fullName, sections.id, courses.code, sections.sectionCode),
  ]);

  const attendanceBySection = new Map(attendanceRows.map((a) => [a.sectionId, a]));
  const gradesBySection = new Map(gradeRows.map((g) => [g.sectionId, g]));

  const report = sectionRows.map((s) => {
    const a = attendanceBySection.get(s.id);
    const g = gradesBySection.get(s.id);
    return {
      id: s.id,
      section: `${s.courseCode}-${s.sectionCode}`,
      courseTitle: s.courseTitle,
      teacher: s.teacherName,
      enrolled: s.enrolled,
      capacity: s.capacity,
      fill: percent(s.enrolled, s.capacity),
      attendanceSessions: a?.sessions ?? 0,
      attendanceRate: a ? percent(a.attended, a.total) : null,
      gradeStatus: s.gradeStatus,
      graded: g?.graded ?? 0,
      averageScore: g ? Math.round(g.average * 10) / 10 : null,
      passRate: g ? percent(g.passed, g.graded) : null,
    };
  });

  const atRisk = studentAttendance
    .map((s) => ({ ...s, rate: percent(s.attended, s.total)! }))
    .filter((s) => s.rate < AT_RISK_ATTENDANCE)
    .sort((a, b) => a.rate - b.rate);

  const sum = (pick: (r: (typeof report)[number]) => number) => report.reduce((n, r) => n + pick(r), 0);
  const allAttended = attendanceRows.reduce((n, a) => n + a.attended, 0);
  const allMarked = attendanceRows.reduce((n, a) => n + a.total, 0);

  return {
    termId: term.id,
    sections: report,
    atRisk,
    totals: {
      sections: report.length,
      enrollments: sum((r) => r.enrolled),
      seats: sum((r) => r.capacity),
      attendanceRate: percent(allAttended, allMarked),
      published: report.filter((r) => r.gradeStatus === "published").length,
      atRiskThreshold: AT_RISK_ATTENDANCE,
    },
  };
}

// ── CSV export ─────────────────────────────────────────────────

/** Quote a value for CSV, and neutralise cells that a spreadsheet would run as a formula. */
function csvCell(value: unknown) {
  let text = value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const toCsv = (header: string[], rows: unknown[][]) =>
  // The BOM makes Excel read the file as UTF-8, so Khmer names display correctly.
  "﻿" + [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");

export async function termReportCsv(user: CurrentUser, kind: "sections" | "at-risk", termId?: number) {
  await authorize(user, "report:export", { global: true });
  const report = await termReport(user, termId);

  if (kind === "at-risk") {
    return toCsv(
      ["Student ID", "Name", "Section", "Attendance %", "Absent", "Classes marked"],
      report.atRisk.map((s) => [s.studentCode, s.name, s.section, s.rate, s.absent, s.total]),
    );
  }
  return toCsv(
    ["Section", "Course", "Teacher", "Enrolled", "Capacity", "Attendance sessions", "Attendance %", "Grade status", "Graded", "Average score", "Pass %"],
    report.sections.map((s) => [
      s.section,
      s.courseTitle,
      s.teacher,
      s.enrolled,
      s.capacity,
      s.attendanceSessions,
      s.attendanceRate,
      s.gradeStatus,
      s.graded,
      s.averageScore,
      s.passRate,
    ]),
  );
}
