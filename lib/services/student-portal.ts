import "server-only";
import { and, eq } from "drizzle-orm";
import { sections } from "@/db/schema";
import { forbidden } from "@/lib/api/errors";
import { authorize } from "@/lib/auth/authz";
import type { CurrentUser } from "@/lib/auth/current-user";
import { schoolToday } from "@/lib/format";
import { computeGpa } from "@/lib/grading";
import { getCurrentTerm, listSections } from "@/lib/queries";
import { sectionScopeFilter } from "@/lib/scoped";
import { attendanceBySection, attendanceRate, gpaSummary, recentAttendance } from "@/lib/student-data";

/*
 * The student's own data. The student id always comes from the session,
 * never from the request, so a student can't ask for someone else's records.
 */

function studentIdOf(user: CurrentUser) {
  if (!user.studentId) throw forbidden("This account has no student profile.");
  return user.studentId;
}

async function mySections(user: CurrentUser) {
  const term = await getCurrentTerm();
  const rows = term ? await listSections(and(eq(sections.termId, term.id), sectionScopeFilter(user, "own"))) : [];
  // Students don't need internal fields such as the grade workflow state of the section.
  return {
    term,
    sections: rows.map((s) => ({
      id: s.id,
      courseCode: s.courseCode,
      courseTitle: s.courseTitle,
      sectionCode: s.sectionCode,
      credits: s.credits,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      room: s.room,
      teacherName: s.teacherName,
    })),
  };
}

export async function studentDashboard(user: CurrentUser) {
  await authorize(user, "section:read");
  const studentId = studentIdOf(user);
  const [{ term, sections: mine }, gpa, attendance] = await Promise.all([
    mySections(user),
    gpaSummary(studentId),
    attendanceBySection(studentId),
  ]);
  const totals = attendance.reduce(
    (t, a) => ({ present: t.present + a.present, late: t.late + a.late, total: t.total + a.total }),
    { present: 0, late: 0, total: 0 },
  );
  const weekday = schoolToday().weekday;
  return {
    term,
    courseCount: mine.length,
    todays: mine.filter((s) => s.dayOfWeek === weekday),
    cgpa: gpa.cgpa,
    credits: gpa.credits,
    attendanceRate: attendanceRate(totals),
    latestGrades: gpa.rows.slice(0, 5),
  };
}

export async function studentTimetable(user: CurrentUser) {
  await authorize(user, "section:read");
  studentIdOf(user);
  return mySections(user);
}

export async function studentAttendance(user: CurrentUser) {
  await authorize(user, "attendance:read");
  const studentId = studentIdOf(user);
  const [bySection, recent] = await Promise.all([attendanceBySection(studentId), recentAttendance(studentId)]);
  return { bySection: bySection.map((a) => ({ ...a, rate: attendanceRate(a) })), recent };
}

export async function studentGrades(user: CurrentUser) {
  await authorize(user, "grade:read");
  const { cgpa, credits, rows } = await gpaSummary(studentIdOf(user));

  const terms = new Map<number, { termId: number; label: string; gpa: number | null; courses: typeof rows }>();
  for (const r of rows) {
    const t = terms.get(r.termId) ?? { termId: r.termId, label: `${r.yearName} · ${r.termName}`, gpa: null, courses: [] };
    t.courses.push(r);
    terms.set(r.termId, t);
  }
  for (const t of terms.values()) t.gpa = computeGpa(t.courses);
  return { cgpa, credits, terms: [...terms.values()] };
}
