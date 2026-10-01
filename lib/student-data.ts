import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  academicYears,
  attendanceRecords,
  attendanceSessions,
  courses,
  enrollments,
  grades,
  sections,
  terms,
} from "@/db/schema";
import { computeGpa } from "@/lib/grading";

/**
 * Queries for the student portal. Every function takes the student's own id,
 * which comes from the session — never from the URL — so a student can only
 * ever read their own records.
 */

/** Published grades only: students must not see drafts or grades under review. */
export async function publishedGrades(studentId: number) {
  return db
    .select({
      termId: terms.id,
      termName: terms.name,
      yearName: academicYears.name,
      termStart: terms.startDate,
      courseCode: courses.code,
      courseTitle: courses.title,
      credits: courses.credits,
      score: grades.score,
      letter: grades.letter,
      gradePoint: grades.gradePoint,
    })
    .from(enrollments)
    .innerJoin(sections, eq(sections.id, enrollments.sectionId))
    .innerJoin(courses, eq(courses.id, sections.courseId))
    .innerJoin(terms, eq(terms.id, sections.termId))
    .innerJoin(academicYears, eq(academicYears.id, terms.academicYearId))
    .innerJoin(grades, eq(grades.enrollmentId, enrollments.id))
    .where(and(eq(enrollments.studentId, studentId), eq(enrollments.status, "enrolled"), eq(sections.gradeStatus, "published")))
    .orderBy(desc(terms.startDate), courses.code);
}

export async function gpaSummary(studentId: number) {
  const rows = await publishedGrades(studentId);
  const credits = rows.reduce((n, r) => n + r.credits, 0);
  return { cgpa: computeGpa(rows), credits, rows };
}

export async function attendanceBySection(studentId: number) {
  return db
    .select({
      sectionId: sections.id,
      courseCode: courses.code,
      sectionCode: sections.sectionCode,
      courseTitle: courses.title,
      present: sql<number>`sum(${attendanceRecords.status} = 'present')`.mapWith(Number),
      late: sql<number>`sum(${attendanceRecords.status} = 'late')`.mapWith(Number),
      absent: sql<number>`sum(${attendanceRecords.status} = 'absent')`.mapWith(Number),
      excused: sql<number>`sum(${attendanceRecords.status} = 'excused')`.mapWith(Number),
      total: sql<number>`count(*)`.mapWith(Number),
    })
    .from(attendanceRecords)
    .innerJoin(attendanceSessions, eq(attendanceSessions.id, attendanceRecords.attendanceSessionId))
    .innerJoin(sections, eq(sections.id, attendanceSessions.sectionId))
    .innerJoin(courses, eq(courses.id, sections.courseId))
    .where(eq(attendanceRecords.studentId, studentId))
    .groupBy(sections.id, courses.code, sections.sectionCode, courses.title)
    .orderBy(courses.code);
}

export async function recentAttendance(studentId: number, limit = 20) {
  return db
    .select({
      id: attendanceRecords.id,
      date: attendanceSessions.date,
      status: attendanceRecords.status,
      note: attendanceRecords.note,
      courseCode: courses.code,
      courseTitle: courses.title,
    })
    .from(attendanceRecords)
    .innerJoin(attendanceSessions, eq(attendanceSessions.id, attendanceRecords.attendanceSessionId))
    .innerJoin(sections, eq(sections.id, attendanceSessions.sectionId))
    .innerJoin(courses, eq(courses.id, sections.courseId))
    .where(eq(attendanceRecords.studentId, studentId))
    .orderBy(desc(attendanceSessions.date))
    .limit(limit);
}

/** Present + late count as attended. */
export const attendanceRate = (a: { present: number; late: number; total: number }) =>
  a.total ? Math.round(((a.present + a.late) / a.total) * 100) : null;
