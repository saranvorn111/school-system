import "server-only";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { sections, type PermissionScope } from "@/db/schema";
import { forbidden, notFound, unauthorized } from "@/lib/api/errors";
import { audit } from "@/lib/audit";
import { getCurrentUser, type CurrentUser } from "./current-user";
import type { Permission } from "./permissions";

/**
 * Authorization rules (from the requirements, section 24):
 *  - Never trust the frontend. Every API route calls these through its service.
 *  - A permission answers "may you do this action?".
 *  - Its scope answers "on which records?".
 *
 * These throw ApiError (401/403/404); the API layer turns that into a JSON response.
 */

export async function currentUserOrThrow(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw unauthorized();
  return user;
}

/** For server layouts/pages: send visitors who aren't logged in to /login. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export function can(user: CurrentUser, permission: Permission): PermissionScope | undefined {
  return user.permissions.get(permission);
}

async function deny(user: CurrentUser, permission: Permission, entity?: { type: string; id: number }): Promise<never> {
  await audit({
    actorUserId: user.id,
    action: "access.denied",
    entityType: entity?.type ?? "permission",
    entityId: entity ? String(entity.id) : permission,
    result: "failure",
    reason: permission,
  });
  throw forbidden();
}

/**
 * Returns the scope the user holds for `permission`, or throws 403.
 * `{ global: true }` is for institution-wide data (admin screens): holding the
 * permission with a narrower scope is then not enough.
 */
export async function authorize(user: CurrentUser, permission: Permission, options?: { global?: boolean }) {
  const scope = can(user, permission);
  if (!scope || (options?.global && scope !== "global")) return deny(user, permission);
  return scope;
}

/**
 * Checks `permission` *and* that the user may work with this whole section
 * (its roster, everyone's attendance, everyone's grades):
 *   global   → any section
 *   assigned → only sections the teacher teaches
 *   own      → never. "Own" means the student's *own* records, not their
 *              classmates'. Student endpoints query by `user.studentId` instead.
 */
export async function authorizeSection(user: CurrentUser, permission: Permission, sectionId: number) {
  const scope = await authorize(user, permission);
  const [section] = await db.select().from(sections).where(eq(sections.id, sectionId));
  if (!section) throw notFound("Section not found.");

  if (scope === "global") return { scope, section };
  if (scope === "assigned" && user.teacherId !== null && section.teacherId === user.teacherId) {
    return { scope, section };
  }
  return deny(user, permission, { type: "section", id: sectionId });
}

/** Where each role lands after login. */
export function homePathFor(user: Pick<CurrentUser, "roles">) {
  if (user.roles.includes("ADMIN")) return "/admin";
  if (user.roles.includes("TEACHER")) return "/teacher";
  if (user.roles.includes("STUDENT")) return "/student";
  return "/account";
}
