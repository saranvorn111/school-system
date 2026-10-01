import "server-only";
import { and, eq, sql, type SQL } from "drizzle-orm";
import { enrollments, sections, type PermissionScope } from "@/db/schema";
import type { CurrentUser } from "@/lib/auth/current-user";

/**
 * SQL filter for "sections this user may see" with the given scope.
 * Use in list queries so a teacher never even loads another teacher's classes.
 */
export function sectionScopeFilter(user: CurrentUser, scope: PermissionScope): SQL | undefined {
  if (scope === "global") return undefined;
  if (scope === "assigned") return user.teacherId ? eq(sections.teacherId, user.teacherId) : sql`false`;
  return user.studentId
    ? sql`${sections.id} in (${sqlSectionIdsFor(user.studentId)})`
    : sql`false`;
}

const sqlSectionIdsFor = (studentId: number) =>
  sql`select ${enrollments.sectionId} from ${enrollments} where ${and(
    eq(enrollments.studentId, studentId),
    eq(enrollments.status, "enrolled"),
  )}`;
