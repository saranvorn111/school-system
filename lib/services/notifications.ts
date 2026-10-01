import "server-only";
import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db, type Tx } from "@/db";
import { courses, enrollments, notifications, permissions, rolePermissions, sections, students, teachers, userRoles, users } from "@/db/schema";
import type { CurrentUser } from "@/lib/auth/current-user";
import type { Permission } from "@/lib/auth/permissions";

type Message = { type: string; title: string; body?: string; href?: string };

/**
 * Creates an in-app notification for each user. Pass `tx` to write it in the
 * same transaction as the change that caused it, so a failed change never notifies.
 */
export async function notify(userIds: number[], message: Message, tx?: Tx) {
  const unique = [...new Set(userIds)];
  if (unique.length === 0) return;
  await (tx ?? db).insert(notifications).values(unique.map((userId) => ({ userId, ...message })));
}

// ── Who should be told ─────────────────────────────────────────

/** Active users whose role holds `permission` with global scope (e.g. grade reviewers). */
export async function userIdsWithPermission(permission: Permission) {
  const rows = await db
    .selectDistinct({ id: users.id })
    .from(users)
    .innerJoin(userRoles, eq(userRoles.userId, users.id))
    .innerJoin(rolePermissions, eq(rolePermissions.roleId, userRoles.roleId))
    .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
    .where(and(eq(permissions.code, permission), eq(rolePermissions.scope, "global"), eq(users.status, "active")));
  return rows.map((r) => r.id);
}

export async function userIdsOfStudents(studentIds: number[]) {
  if (studentIds.length === 0) return [];
  const rows = await db.select({ userId: students.userId }).from(students).where(inArray(students.id, studentIds));
  return rows.map((r) => r.userId);
}

export async function userIdsEnrolledIn(sectionId: number) {
  const rows = await db
    .select({ userId: students.userId })
    .from(enrollments)
    .innerJoin(students, eq(students.id, enrollments.studentId))
    .where(and(eq(enrollments.sectionId, sectionId), eq(enrollments.status, "enrolled")));
  return rows.map((r) => r.userId);
}

export async function userIdOfTeacher(teacherId: number | null) {
  if (!teacherId) return [];
  const [row] = await db.select({ userId: teachers.userId }).from(teachers).where(eq(teachers.id, teacherId));
  return row ? [row.userId] : [];
}

// ── The user's own inbox ───────────────────────────────────────

export async function listMyNotifications(user: CurrentUser) {
  const [items, [{ unread }]] = await Promise.all([
    db
      .select({
        id: notifications.id,
        type: notifications.type,
        title: notifications.title,
        body: notifications.body,
        href: notifications.href,
        readAt: notifications.readAt,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .where(eq(notifications.userId, user.id))
      .orderBy(desc(notifications.id))
      .limit(20),
    db
      .select({ unread: sql<number>`count(*)`.mapWith(Number) })
      .from(notifications)
      .where(and(eq(notifications.userId, user.id), isNull(notifications.readAt))),
  ]);
  return { unread, items };
}

/** Marks one notification (or all, when `id` is omitted) as read. Only ever touches the user's own rows. */
export async function markNotificationsRead(user: CurrentUser, id?: number) {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, user.id), isNull(notifications.readAt), id ? eq(notifications.id, id) : undefined));
}

/** "CS101-A" style name of a section, for notification titles. */
export async function sectionLabel(sectionId: number) {
  const [row] = await db
    .select({ code: courses.code, section: sections.sectionCode })
    .from(sections)
    .innerJoin(courses, eq(courses.id, sections.courseId))
    .where(eq(sections.id, sectionId));
  return row ? `${row.code}-${row.section}` : `section #${sectionId}`;
}
