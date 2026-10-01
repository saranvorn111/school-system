import {
  boolean,
  date,
  datetime,
  decimal,
  foreignKey,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  text,
  tinyint,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import {
  attendanceStatuses,
  degreeLevels,
  genders,
  gradeStatuses,
  permissionScopes,
  studentStatuses,
  userStatuses,
} from "../lib/constants";

export type { AttendanceStatus, GradeStatus, PermissionScope } from "../lib/constants";
export { attendanceStatuses, gradeStatuses, permissionScopes };

const createdAt = () =>
  datetime("created_at", { mode: "date" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`);

const updatedAt = () =>
  datetime("updated_at", { mode: "date" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date());

// ─────────────────────────────────────────────────────────────
// Identity: users, sessions, login history
// ─────────────────────────────────────────────────────────────

export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  email: varchar("email", { length: 191 }).notNull().unique(),
  // Student code / employee ID doubles as the username, so people can
  // log in with either their email or their ID.
  username: varchar("username", { length: 64 }).notNull().unique(),
  fullName: varchar("full_name", { length: 150 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  status: mysqlEnum("status", userStatuses)
    .notNull()
    .default("active"),
  failedLoginCount: int("failed_login_count").notNull().default(0),
  lockedUntil: datetime("locked_until", { mode: "date" }),
  mustChangePassword: boolean("must_change_password").notNull().default(false),
  lastLoginAt: datetime("last_login_at", { mode: "date" }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const sessions = mysqlTable(
  "sessions",
  {
    // SHA-256 of the random token stored in the cookie. The raw token is
    // never saved, so a database leak cannot be replayed as a login.
    id: varchar("id", { length: 64 }).primaryKey(),
    userId: int("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    userAgent: varchar("user_agent", { length: 255 }),
    ip: varchar("ip", { length: 64 }),
    createdAt: createdAt(),
    lastSeenAt: datetime("last_seen_at", { mode: "date" }).notNull(),
    expiresAt: datetime("expires_at", { mode: "date" }).notNull(),
    revokedAt: datetime("revoked_at", { mode: "date" }),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const loginHistory = mysqlTable(
  "login_history",
  {
    id: int("id").primaryKey().autoincrement(),
    userId: int("user_id").references(() => users.id, { onDelete: "set null" }),
    identifier: varchar("identifier", { length: 191 }).notNull(),
    success: boolean("success").notNull(),
    reason: varchar("reason", { length: 64 }),
    ip: varchar("ip", { length: 64 }),
    userAgent: varchar("user_agent", { length: 255 }),
    createdAt: createdAt(),
  },
  (t) => [index("login_history_user_idx").on(t.userId)],
);

// ─────────────────────────────────────────────────────────────
// Authorization: roles, permissions, scopes
// ─────────────────────────────────────────────────────────────

export const roles = mysqlTable("roles", {
  id: int("id").primaryKey().autoincrement(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  name: varchar("name", { length: 64 }).notNull(),
});

export const permissions = mysqlTable("permissions", {
  id: int("id").primaryKey().autoincrement(),
  code: varchar("code", { length: 64 }).notNull().unique(),
  description: varchar("description", { length: 255 }).notNull(),
});

// The scope says *which records* a role may use the permission on:
//   global   → every record
//   assigned → records linked to the user (a teacher's own sections)
//   own      → the user's own record (a student's own grades)
export const rolePermissions = mysqlTable(
  "role_permissions",
  {
    roleId: int("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: int("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
    scope: mysqlEnum("scope", permissionScopes).notNull().default("global"),
  },
  (t) => [primaryKey({ columns: [t.roleId, t.permissionId] })],
);

export const userRoles = mysqlTable(
  "user_roles",
  {
    userId: int("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: int("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.roleId] })],
);

// ─────────────────────────────────────────────────────────────
// Organization and people
// ─────────────────────────────────────────────────────────────

export const departments = mysqlTable("departments", {
  id: int("id").primaryKey().autoincrement(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 150 }).notNull(),
  createdAt: createdAt(),
});

export const programs = mysqlTable("programs", {
  id: int("id").primaryKey().autoincrement(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 150 }).notNull(),
  degreeLevel: mysqlEnum("degree_level", degreeLevels)
    .notNull()
    .default("bachelor"),
  departmentId: int("department_id")
    .notNull()
    .references(() => departments.id),
  createdAt: createdAt(),
});

export const teachers = mysqlTable("teachers", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  employeeId: varchar("employee_id", { length: 32 }).notNull().unique(),
  departmentId: int("department_id").references(() => departments.id),
  title: varchar("title", { length: 64 }),
  phone: varchar("phone", { length: 32 }),
  createdAt: createdAt(),
});

export const students = mysqlTable("students", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  studentCode: varchar("student_code", { length: 32 }).notNull().unique(),
  programId: int("program_id").references(() => programs.id),
  admissionYear: int("admission_year").notNull(),
  status: mysqlEnum("status", studentStatuses)
    .notNull()
    .default("active"),
  gender: mysqlEnum("gender", genders),
  dateOfBirth: date("date_of_birth", { mode: "string" }),
  phone: varchar("phone", { length: 32 }),
  createdAt: createdAt(),
});

// ─────────────────────────────────────────────────────────────
// Academic structure
// ─────────────────────────────────────────────────────────────

export const academicYears = mysqlTable("academic_years", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 32 }).notNull().unique(),
  startDate: date("start_date", { mode: "string" }).notNull(),
  endDate: date("end_date", { mode: "string" }).notNull(),
});

export const terms = mysqlTable(
  "terms",
  {
    id: int("id").primaryKey().autoincrement(),
    academicYearId: int("academic_year_id")
      .notNull()
      .references(() => academicYears.id),
    name: varchar("name", { length: 64 }).notNull(),
    startDate: date("start_date", { mode: "string" }).notNull(),
    endDate: date("end_date", { mode: "string" }).notNull(),
    isCurrent: boolean("is_current").notNull().default(false),
  },
  (t) => [uniqueIndex("terms_year_name_uq").on(t.academicYearId, t.name)],
);

export const courses = mysqlTable("courses", {
  id: int("id").primaryKey().autoincrement(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  title: varchar("title", { length: 150 }).notNull(),
  credits: tinyint("credits").notNull(),
  departmentId: int("department_id").references(() => departments.id),
  description: text("description"),
  createdAt: createdAt(),
});

export const sections = mysqlTable(
  "sections",
  {
    id: int("id").primaryKey().autoincrement(),
    courseId: int("course_id")
      .notNull()
      .references(() => courses.id),
    termId: int("term_id")
      .notNull()
      .references(() => terms.id),
    sectionCode: varchar("section_code", { length: 10 }).notNull(),
    teacherId: int("teacher_id").references(() => teachers.id),
    room: varchar("room", { length: 32 }),
    // 1 = Monday … 7 = Sunday (ISO weekday)
    dayOfWeek: tinyint("day_of_week").notNull(),
    // "HH:MM", 24-hour clock
    startTime: varchar("start_time", { length: 5 }).notNull(),
    endTime: varchar("end_time", { length: 5 }).notNull(),
    capacity: int("capacity").notNull(),
    gradeStatus: mysqlEnum("grade_status", gradeStatuses)
      .notNull()
      .default("draft"),
    gradeReviewNote: varchar("grade_review_note", { length: 255 }),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("sections_course_term_code_uq").on(
      t.courseId,
      t.termId,
      t.sectionCode,
    ),
    index("sections_teacher_idx").on(t.teacherId),
  ],
);

export const enrollments = mysqlTable(
  "enrollments",
  {
    id: int("id").primaryKey().autoincrement(),
    sectionId: int("section_id")
      .notNull()
      .references(() => sections.id),
    studentId: int("student_id")
      .notNull()
      .references(() => students.id),
    status: mysqlEnum("status", ["enrolled", "dropped"])
      .notNull()
      .default("enrolled"),
    enrolledAt: createdAt(),
  },
  (t) => [
    uniqueIndex("enrollments_section_student_uq").on(t.sectionId, t.studentId),
    index("enrollments_student_idx").on(t.studentId),
  ],
);

// ─────────────────────────────────────────────────────────────
// Attendance
// ─────────────────────────────────────────────────────────────

export const attendanceSessions = mysqlTable(
  "attendance_sessions",
  {
    id: int("id").primaryKey().autoincrement(),
    sectionId: int("section_id")
      .notNull()
      .references(() => sections.id),
    date: date("date", { mode: "string" }).notNull(),
    startedById: int("started_by_id")
      .notNull()
      .references(() => users.id),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("attendance_sessions_section_date_uq").on(t.sectionId, t.date)],
);

export const attendanceRecords = mysqlTable(
  "attendance_records",
  {
    id: int("id").primaryKey().autoincrement(),
    // FK declared below with a short name: the generated one exceeds MySQL's 64-char limit.
    attendanceSessionId: int("attendance_session_id").notNull(),
    studentId: int("student_id")
      .notNull()
      .references(() => students.id),
    status: mysqlEnum("status", attendanceStatuses).notNull(),
    note: varchar("note", { length: 255 }),
    markedById: int("marked_by_id")
      .notNull()
      .references(() => users.id),
    markedAt: updatedAt(),
  },
  (t) => [
    foreignKey({
      name: "attendance_records_session_fk",
      columns: [t.attendanceSessionId],
      foreignColumns: [attendanceSessions.id],
    }).onDelete("cascade"),
    uniqueIndex("attendance_records_session_student_uq").on(
      t.attendanceSessionId,
      t.studentId,
    ),
    index("attendance_records_student_idx").on(t.studentId),
  ],
);

// ─────────────────────────────────────────────────────────────
// Grades
// ─────────────────────────────────────────────────────────────

export const grades = mysqlTable("grades", {
  id: int("id").primaryKey().autoincrement(),
  enrollmentId: int("enrollment_id")
    .notNull()
    .unique()
    .references(() => enrollments.id, { onDelete: "cascade" }),
  score: decimal("score", { precision: 5, scale: 2, mode: "number" }).notNull(),
  letter: varchar("letter", { length: 2 }).notNull(),
  gradePoint: decimal("grade_point", { precision: 3, scale: 2, mode: "number" }).notNull(),
  updatedById: int("updated_by_id")
    .notNull()
    .references(() => users.id),
  updatedAt: updatedAt(),
});

// ─────────────────────────────────────────────────────────────
// Audit
// ─────────────────────────────────────────────────────────────

export const auditLogs = mysqlTable(
  "audit_logs",
  {
    id: int("id").primaryKey().autoincrement(),
    actorUserId: int("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: varchar("action", { length: 64 }).notNull(),
    entityType: varchar("entity_type", { length: 64 }).notNull(),
    entityId: varchar("entity_id", { length: 64 }),
    before: json("before"),
    after: json("after"),
    result: mysqlEnum("result", ["success", "failure"]).notNull().default("success"),
    reason: varchar("reason", { length: 255 }),
    ip: varchar("ip", { length: 64 }),
    createdAt: createdAt(),
  },
  (t) => [
    index("audit_logs_entity_idx").on(t.entityType, t.entityId),
    index("audit_logs_created_idx").on(t.createdAt),
  ],
);

// ─────────────────────────────────────────────────────────────
// Notifications (in-app)
// ─────────────────────────────────────────────────────────────

export const notifications = mysqlTable(
  "notifications",
  {
    id: int("id").primaryKey().autoincrement(),
    userId: int("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // e.g. "grade.published" — the event that caused it
    type: varchar("type", { length: 64 }).notNull(),
    title: varchar("title", { length: 191 }).notNull(),
    body: varchar("body", { length: 500 }),
    // Page to open when the notification is clicked
    href: varchar("href", { length: 255 }),
    readAt: datetime("read_at", { mode: "date" }),
    createdAt: createdAt(),
  },
  (t) => [index("notifications_user_read_idx").on(t.userId, t.readAt)],
);
