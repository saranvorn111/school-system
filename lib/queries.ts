import "server-only";
import { and, asc, desc, eq, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { db } from "@/db";
import {
  academicYears,
  courses,
  departments,
  enrollments,
  grades,
  programs,
  sections,
  students,
  teachers,
  terms,
  users,
} from "@/db/schema";

/** The term marked "current", or the most recent one if none is marked. */
export async function getCurrentTerm() {
  const [term] = await db
    .select({ id: terms.id, name: terms.name, yearName: academicYears.name, startDate: terms.startDate, endDate: terms.endDate })
    .from(terms)
    .innerJoin(academicYears, eq(academicYears.id, terms.academicYearId))
    .orderBy(desc(terms.isCurrent), desc(terms.startDate))
    .limit(1);
  return term ?? null;
}

export async function listTerms() {
  return db
    .select({
      id: terms.id,
      academicYearId: terms.academicYearId,
      name: terms.name,
      yearName: academicYears.name,
      startDate: terms.startDate,
      endDate: terms.endDate,
      isCurrent: terms.isCurrent,
    })
    .from(terms)
    .innerJoin(academicYears, eq(academicYears.id, terms.academicYearId))
    .orderBy(desc(terms.startDate));
}

export const termLabel = (t: { yearName: string; name: string }) => `${t.yearName} · ${t.name}`;

const teacherUser = alias(users, "teacher_user");

/** Sections with course, term, teacher and enrollment count. */
export async function listSections(where?: SQL) {
  // Aggregate once and join, instead of a correlated subquery per row.
  const counts = db
    .select({ sectionId: enrollments.sectionId, n: sql<number>`count(*)`.as("n") })
    .from(enrollments)
    .where(eq(enrollments.status, "enrolled"))
    .groupBy(enrollments.sectionId)
    .as("enrolled_counts");

  return db
    .select({
      id: sections.id,
      sectionCode: sections.sectionCode,
      room: sections.room,
      dayOfWeek: sections.dayOfWeek,
      startTime: sections.startTime,
      endTime: sections.endTime,
      capacity: sections.capacity,
      gradeStatus: sections.gradeStatus,
      gradeReviewNote: sections.gradeReviewNote,
      termId: sections.termId,
      teacherId: sections.teacherId,
      courseId: courses.id,
      courseCode: courses.code,
      courseTitle: courses.title,
      credits: courses.credits,
      termName: terms.name,
      yearName: academicYears.name,
      teacherName: teacherUser.fullName,
      enrolled: sql<number>`coalesce(${counts.n}, 0)`.mapWith(Number),
    })
    .from(sections)
    .innerJoin(courses, eq(courses.id, sections.courseId))
    .innerJoin(terms, eq(terms.id, sections.termId))
    .innerJoin(academicYears, eq(academicYears.id, terms.academicYearId))
    .leftJoin(teachers, eq(teachers.id, sections.teacherId))
    .leftJoin(teacherUser, eq(teacherUser.id, teachers.userId))
    .leftJoin(counts, eq(counts.sectionId, sections.id))
    .where(where)
    .orderBy(asc(sections.dayOfWeek), asc(sections.startTime), asc(courses.code));
}

export async function getSectionDetail(sectionId: number) {
  const [row] = await listSections(eq(sections.id, sectionId));
  return row ?? null;
}

/** Students enrolled in a section, with their grade if one was entered. */
export async function listRoster(sectionId: number) {
  return db
    .select({
      enrollmentId: enrollments.id,
      studentId: students.id,
      studentCode: students.studentCode,
      fullName: users.fullName,
      email: users.email,
      score: grades.score,
      letter: grades.letter,
      gradePoint: grades.gradePoint,
    })
    .from(enrollments)
    .innerJoin(students, eq(students.id, enrollments.studentId))
    .innerJoin(users, eq(users.id, students.userId))
    .leftJoin(grades, eq(grades.enrollmentId, enrollments.id))
    .where(and(eq(enrollments.sectionId, sectionId), eq(enrollments.status, "enrolled")))
    .orderBy(asc(students.studentCode));
}

export async function listDepartments() {
  return db.select().from(departments).orderBy(asc(departments.code));
}

export async function listPrograms() {
  return db
    .select({
      id: programs.id,
      code: programs.code,
      name: programs.name,
      degreeLevel: programs.degreeLevel,
      departmentId: programs.departmentId,
      departmentName: departments.name,
    })
    .from(programs)
    .innerJoin(departments, eq(departments.id, programs.departmentId))
    .orderBy(asc(programs.code));
}

export async function listTeacherOptions() {
  return db
    .select({ id: teachers.id, name: users.fullName, employeeId: teachers.employeeId })
    .from(teachers)
    .innerJoin(users, eq(users.id, teachers.userId))
    .where(eq(users.status, "active"))
    .orderBy(asc(users.fullName));
}
