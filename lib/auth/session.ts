import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, isNull, ne } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { sessions } from "@/db/schema";
import { getClientInfo } from "@/lib/request";

export const SESSION_COOKIE = "sid";
const SESSION_DAYS = 7;
const TOUCH_INTERVAL_MS = 5 * 60 * 1000;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const { ip, userAgent } = await getClientInfo();

  await db.insert(sessions).values({
    id: hashToken(token),
    userId,
    ip,
    userAgent,
    lastSeenAt: now,
    expiresAt,
  });

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/** Looks up the session from the cookie. Returns null if missing, expired or revoked. */
export async function getSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const now = new Date();
  const [session] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, hashToken(token)), isNull(sessions.revokedAt), gt(sessions.expiresAt, now)));
  if (!session) return null;

  if (now.getTime() - session.lastSeenAt.getTime() > TOUCH_INTERVAL_MS) {
    await db.update(sessions).set({ lastSeenAt: now }).where(eq(sessions.id, session.id));
  }
  return session;
}

/** Logs out the current device. */
export async function deleteSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.id, hashToken(token)));
  }
  store.delete(SESSION_COOKIE);
}

/** Logs out every device of a user, optionally keeping one session (the current one). */
export async function revokeUserSessions(userId: number, keepSessionId?: string) {
  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(sessions.userId, userId),
        isNull(sessions.revokedAt),
        keepSessionId ? ne(sessions.id, keepSessionId) : undefined,
      ),
    );
}

export async function revokeSession(userId: number, sessionId: string) {
  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)));
}
