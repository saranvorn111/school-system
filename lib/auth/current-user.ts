import "server-only";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  permissions,
  rolePermissions,
  roles,
  students,
  teachers,
  userRoles,
  users,
  type PermissionScope,
} from "@/db/schema";
import { getSession } from "./session";
import { widestScope, type Permission, type RoleCode } from "./permissions";

export type CurrentUser = {
  id: number;
  sessionId: string;
  email: string;
  username: string;
  fullName: string;
  mustChangePassword: boolean;
  roles: RoleCode[];
  permissions: Map<Permission, PermissionScope>;
  teacherId: number | null;
  studentId: number | null;
};

/**
 * The logged-in user with roles and permissions, loaded once per request
 * (React `cache` dedupes calls from layouts, pages and actions).
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await getSession();
  if (!session) return null;

  const [user] = await db.select().from(users).where(eq(users.id, session.userId));
  if (!user || user.status !== "active") return null;

  const rows = await db
    .select({ role: roles.code, permission: permissions.code, scope: rolePermissions.scope })
    .from(userRoles)
    .innerJoin(roles, eq(roles.id, userRoles.roleId))
    .leftJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
    .leftJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
    .where(eq(userRoles.userId, user.id));

  const roleSet = new Set<RoleCode>();
  const perms = new Map<Permission, PermissionScope>();
  for (const row of rows) {
    roleSet.add(row.role as RoleCode);
    if (row.permission && row.scope) {
      const code = row.permission as Permission;
      perms.set(code, widestScope(perms.get(code), row.scope));
    }
  }

  const [[teacher], [student]] = await Promise.all([
    db.select({ id: teachers.id }).from(teachers).where(eq(teachers.userId, user.id)),
    db.select({ id: students.id }).from(students).where(eq(students.userId, user.id)),
  ]);

  return {
    id: user.id,
    sessionId: session.id,
    email: user.email,
    username: user.username,
    fullName: user.fullName,
    mustChangePassword: user.mustChangePassword,
    roles: [...roleSet],
    permissions: perms,
    teacherId: teacher?.id ?? null,
    studentId: student?.id ?? null,
  };
});
