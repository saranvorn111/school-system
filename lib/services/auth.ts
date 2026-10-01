import "server-only";
import { and, desc, eq, gt, isNull, or } from "drizzle-orm";
import { db } from "@/db";
import { loginHistory, roles, sessions, userRoles, users } from "@/db/schema";
import { ApiError, conflict, invalid, unauthorized } from "@/lib/api/errors";
import { audit } from "@/lib/audit";
import { homePathFor } from "@/lib/auth/authz";
import type { CurrentUser } from "@/lib/auth/current-user";
import { getDummyHash, hashPassword, verifyPassword } from "@/lib/auth/password";
import { ROLES, type RoleCode } from "@/lib/auth/permissions";
import { createSession, deleteSession, revokeSession, revokeUserSessions } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";
import { getClientInfo } from "@/lib/request";
import type { changePasswordSchema, LoginInput } from "@/lib/validation/auth";
import type * as z from "zod";

const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;
const GENERIC_ERROR = "Invalid login details.";

/** Verifies credentials, applies lockout rules, and starts a session (sets the cookie). */
export async function login({ identifier, password }: LoginInput) {
  const client = await getClientInfo();
  const limit = rateLimit(`login:${client.ip}`, 10, 60_000);
  if (!limit.ok) {
    throw new ApiError(429, `Too many attempts. Try again in ${Math.ceil(limit.retryAfterMs / 1000)} seconds.`);
  }

  const record = (userId: number | null, success: boolean, reason: string) =>
    db.insert(loginHistory).values({
      userId,
      identifier: identifier.slice(0, 191),
      success,
      reason,
      ip: client.ip,
      userAgent: client.userAgent,
    });

  const [user] = await db
    .select()
    .from(users)
    .where(or(eq(users.email, identifier.toLowerCase()), eq(users.username, identifier)));

  if (!user) {
    await verifyPassword(password, await getDummyHash());
    await record(null, false, "unknown_user");
    throw unauthorized(GENERIC_ERROR);
  }

  const now = new Date();
  if (user.lockedUntil && user.lockedUntil > now) {
    await record(user.id, false, "locked");
    const minutes = Math.ceil((user.lockedUntil.getTime() - now.getTime()) / 60_000);
    throw new ApiError(423, `This account is temporarily locked. Try again in ${minutes} minute(s) or contact the administrator.`);
  }

  if (!(await verifyPassword(password, user.passwordHash))) {
    const failed = user.failedLoginCount + 1;
    const lock = failed >= MAX_FAILED_LOGINS;
    await db
      .update(users)
      .set(lock ? { failedLoginCount: 0, lockedUntil: new Date(now.getTime() + LOCK_MINUTES * 60_000) } : { failedLoginCount: failed })
      .where(eq(users.id, user.id));
    await record(user.id, false, "bad_password");
    if (lock) {
      await audit({ actorUserId: null, action: "user.locked", entityType: "user", entityId: user.id, reason: `${MAX_FAILED_LOGINS} failed logins` });
      throw new ApiError(423, `Too many failed attempts. The account is locked for ${LOCK_MINUTES} minutes.`);
    }
    throw unauthorized(GENERIC_ERROR);
  }

  // Checked after the password so a wrong guess can't reveal that an account is disabled.
  if (user.status !== "active") {
    await record(user.id, false, `status_${user.status}`);
    throw new ApiError(403, "This account is not active. Please contact the administrator.");
  }

  await db.update(users).set({ failedLoginCount: 0, lockedUntil: null, lastLoginAt: now }).where(eq(users.id, user.id));
  await createSession(user.id);
  await record(user.id, true, "ok");

  const roleRows = await db
    .select({ code: roles.code })
    .from(userRoles)
    .innerJoin(roles, eq(roles.id, userRoles.roleId))
    .where(eq(userRoles.userId, user.id));
  const home = homePathFor({ roles: roleRows.map((r) => r.code as RoleCode) });
  return { redirectTo: user.mustChangePassword ? "/account?changePassword=1" : home };
}

export async function logout(user: CurrentUser | null) {
  await deleteSession();
  if (user) await audit({ actorUserId: user.id, action: "auth.logout", entityType: "user", entityId: user.id });
}

export async function logoutAllDevices(user: CurrentUser) {
  await revokeUserSessions(user.id);
  await deleteSession();
  await audit({ actorUserId: user.id, action: "auth.logout_all", entityType: "user", entityId: user.id });
}

/** What the browser needs about the logged-in user. Permissions are sent as a plain list. */
export function me(user: CurrentUser) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    username: user.username,
    mustChangePassword: user.mustChangePassword,
    roles: user.roles.map((code) => ({ code, name: ROLES[code as RoleCode] })),
    permissions: [...user.permissions.keys()],
    isTeacher: user.teacherId !== null,
    isStudent: user.studentId !== null,
    home: homePathFor(user),
  };
}
export type Me = ReturnType<typeof me>;

export async function listMySessions(user: CurrentUser) {
  const rows = await db
    .select({ id: sessions.id, ip: sessions.ip, userAgent: sessions.userAgent, createdAt: sessions.createdAt, lastSeenAt: sessions.lastSeenAt })
    .from(sessions)
    .where(and(eq(sessions.userId, user.id), isNull(sessions.revokedAt), gt(sessions.expiresAt, new Date())))
    .orderBy(desc(sessions.lastSeenAt));
  return rows.map((s) => ({ ...s, current: s.id === user.sessionId }));
}

export async function revokeMySession(user: CurrentUser, sessionId: string) {
  if (sessionId === user.sessionId) throw conflict("Use Log out to end the current session.");
  await revokeSession(user.id, sessionId);
  await audit({ actorUserId: user.id, action: "session.revoked", entityType: "user", entityId: user.id });
}

export async function changePassword(user: CurrentUser, input: z.infer<typeof changePasswordSchema>) {
  const [row] = await db.select().from(users).where(eq(users.id, user.id));
  if (!(await verifyPassword(input.currentPassword, row.passwordHash))) {
    throw invalid("Current password is incorrect.", { currentPassword: ["Incorrect password."] });
  }
  await db
    .update(users)
    .set({ passwordHash: await hashPassword(input.newPassword), mustChangePassword: false })
    .where(eq(users.id, user.id));
  // Sign out other devices: whoever knew the old password shouldn't stay logged in.
  await revokeUserSessions(user.id, user.sessionId);
  await audit({ actorUserId: user.id, action: "user.password_changed", entityType: "user", entityId: user.id });
}
