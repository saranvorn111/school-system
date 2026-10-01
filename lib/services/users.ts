import "server-only";
import { and, asc, desc, eq, exists, inArray, like, or, sql } from "drizzle-orm";
import type * as z from "zod";
import { db, isDuplicateKeyError } from "@/db";
import { auditLogs, departments, loginHistory, programs, roles, students, teachers, userRoles, users } from "@/db/schema";
import { conflict, notFound } from "@/lib/api/errors";
import { audit } from "@/lib/audit";
import { authorize } from "@/lib/auth/authz";
import type { CurrentUser } from "@/lib/auth/current-user";
import { generateTempPassword, hashPassword } from "@/lib/auth/password";
import { revokeUserSessions } from "@/lib/auth/session";
import type { createUserSchema, updateUserSchema, userListQuery } from "@/lib/validation/users";

const PAGE_SIZE = 25;

export async function listUsers(user: CurrentUser, query: z.infer<typeof userListQuery>) {
  await authorize(user, "user:read", { global: true });
  const { q, role, page } = query;

  const hasRole = (code: string) =>
    exists(
      db
        .select({ one: sql`1` })
        .from(userRoles)
        .innerJoin(roles, eq(roles.id, userRoles.roleId))
        .where(and(eq(userRoles.userId, users.id), eq(roles.code, code))),
    );

  const rows = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      username: users.username,
      status: users.status,
      lockedUntil: users.lockedUntil,
      lastLoginAt: users.lastLoginAt,
    })
    .from(users)
    .where(
      and(
        q ? or(like(users.fullName, `%${q}%`), like(users.email, `%${q}%`), like(users.username, `%${q}%`)) : undefined,
        role ? hasRole(role) : undefined,
      ),
    )
    .orderBy(asc(users.fullName))
    .limit(PAGE_SIZE + 1)
    .offset((page - 1) * PAGE_SIZE);

  const items = rows.slice(0, PAGE_SIZE);
  const roleRows = items.length
    ? await db
        .select({ userId: userRoles.userId, code: roles.code })
        .from(userRoles)
        .innerJoin(roles, eq(roles.id, userRoles.roleId))
        .where(inArray(userRoles.userId, items.map((u) => u.id)))
    : [];
  const byUser = Map.groupBy(roleRows, (r) => r.userId);
  const now = new Date();

  return {
    page,
    hasNext: rows.length > PAGE_SIZE,
    items: items.map((u) => ({
      ...u,
      locked: !!u.lockedUntil && u.lockedUntil > now,
      roles: (byUser.get(u.id) ?? []).map((r) => r.code),
    })),
  };
}

export async function getUser(user: CurrentUser, id: number) {
  await authorize(user, "user:read", { global: true });
  // Explicit columns: the password hash never leaves the database layer.
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      username: users.username,
      fullName: users.fullName,
      status: users.status,
      lockedUntil: users.lockedUntil,
      mustChangePassword: users.mustChangePassword,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, id));
  if (!row) throw notFound("User not found.");

  const [roleRows, [teacher], [student], logins, history] = await Promise.all([
    db.select({ code: roles.code }).from(userRoles).innerJoin(roles, eq(roles.id, userRoles.roleId)).where(eq(userRoles.userId, id)),
    db
      .select({ employeeId: teachers.employeeId, title: teachers.title, phone: teachers.phone, department: departments.name })
      .from(teachers)
      .leftJoin(departments, eq(departments.id, teachers.departmentId))
      .where(eq(teachers.userId, id)),
    db
      .select({
        studentCode: students.studentCode,
        status: students.status,
        admissionYear: students.admissionYear,
        dateOfBirth: students.dateOfBirth,
        gender: students.gender,
        phone: students.phone,
        program: programs.name,
      })
      .from(students)
      .leftJoin(programs, eq(programs.id, students.programId))
      .where(eq(students.userId, id)),
    db
      .select({ id: loginHistory.id, success: loginHistory.success, reason: loginHistory.reason, ip: loginHistory.ip, createdAt: loginHistory.createdAt })
      .from(loginHistory)
      .where(eq(loginHistory.userId, id))
      .orderBy(desc(loginHistory.id))
      .limit(10),
    db
      .select({ id: auditLogs.id, action: auditLogs.action, createdAt: auditLogs.createdAt })
      .from(auditLogs)
      .where(and(eq(auditLogs.entityType, "user"), eq(auditLogs.entityId, String(id))))
      .orderBy(desc(auditLogs.id))
      .limit(10),
  ]);

  return {
    ...row,
    locked: !!row.lockedUntil && row.lockedUntil > new Date(),
    isSelf: row.id === user.id,
    roles: roleRows.map((r) => r.code),
    teacher: teacher ?? null,
    student: student ?? null,
    logins,
    history,
  };
}

export async function createUser(actor: CurrentUser, data: z.infer<typeof createUserSchema>) {
  await authorize(actor, "user:create", { global: true });
  const username = data.role === "ADMIN" ? data.username : data.role === "TEACHER" ? data.employeeId : data.studentCode;
  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  const userId = await db.transaction(async (tx) => {
    const [{ id }] = await tx
      .insert(users)
      .values({ fullName: data.fullName, email: data.email, username, passwordHash, mustChangePassword: true })
      .$returningId();

    const [role] = await tx.select().from(roles).where(eq(roles.code, data.role));
    await tx.insert(userRoles).values({ userId: id, roleId: role.id });

    if (data.role === "TEACHER") {
      await tx.insert(teachers).values({
        userId: id,
        employeeId: data.employeeId,
        departmentId: data.departmentId,
        title: data.title,
        phone: data.phone,
      });
    } else if (data.role === "STUDENT") {
      await tx.insert(students).values({
        userId: id,
        studentCode: data.studentCode,
        programId: data.programId,
        admissionYear: data.admissionYear,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
        phone: data.phone,
      });
    }

    await audit(
      { actorUserId: actor.id, action: "user.created", entityType: "user", entityId: id, after: { username, email: data.email, role: data.role } },
      tx,
    );
    return id;
  }).catch((e) => {
    if (isDuplicateKeyError(e)) throw conflict("That email, username or ID is already in use.");
    throw e;
  });

  // The temporary password is returned once so the admin can hand it over; it is never stored in plain text.
  return { id: userId, username, tempPassword };
}

async function loadUser(id: number) {
  const [row] = await db.select().from(users).where(eq(users.id, id));
  if (!row) throw notFound("User not found.");
  return row;
}

export async function updateUser(actor: CurrentUser, id: number, data: z.infer<typeof updateUserSchema>) {
  await authorize(actor, "user:update", { global: true });
  const row = await loadUser(id);
  await db.update(users).set(data).where(eq(users.id, id));
  await audit({
    actorUserId: actor.id,
    action: "user.updated",
    entityType: "user",
    entityId: id,
    before: { fullName: row.fullName, email: row.email },
    after: data,
  });
}

export async function setUserStatus(actor: CurrentUser, id: number, status: "active" | "disabled") {
  await authorize(actor, "user:disable", { global: true });
  const row = await loadUser(id);
  if (row.id === actor.id) throw conflict("You can't disable your own account.");

  await db.update(users).set({ status }).where(eq(users.id, id));
  if (status !== "active") await revokeUserSessions(id);
  await audit({
    actorUserId: actor.id,
    action: status === "active" ? "user.enabled" : "user.disabled",
    entityType: "user",
    entityId: id,
    before: { status: row.status },
    after: { status },
  });
}

export async function resetUserPassword(actor: CurrentUser, id: number) {
  await authorize(actor, "user:reset_password", { global: true });
  await loadUser(id);
  const tempPassword = generateTempPassword();
  await db
    .update(users)
    .set({ passwordHash: await hashPassword(tempPassword), mustChangePassword: true, failedLoginCount: 0, lockedUntil: null })
    .where(eq(users.id, id));
  await revokeUserSessions(id);
  await audit({ actorUserId: actor.id, action: "user.password_reset", entityType: "user", entityId: id });
  return { tempPassword };
}

export async function unlockUser(actor: CurrentUser, id: number) {
  await authorize(actor, "user:reset_password", { global: true });
  await loadUser(id);
  await db.update(users).set({ failedLoginCount: 0, lockedUntil: null }).where(eq(users.id, id));
  await audit({ actorUserId: actor.id, action: "user.unlocked", entityType: "user", entityId: id });
}
