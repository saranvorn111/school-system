import "server-only";
import { and, desc, eq, inArray, like, sql } from "drizzle-orm";
import { db, escapeLike } from "@/db";
import { attendanceSessions, auditLogs, loginHistory, sections, students, teachers, users } from "@/db/schema";
import { forbidden } from "@/lib/api/errors";
import { authorize } from "@/lib/auth/authz";
import type { CurrentUser } from "@/lib/auth/current-user";
import { schoolToday } from "@/lib/format";
import { getCurrentTerm, listSections } from "@/lib/queries";
import { sectionScopeFilter } from "@/lib/scoped";

const count = sql<number>`count(*)`.mapWith(Number);

export async function adminDashboard(user: CurrentUser) {
  await authorize(user, "report:read", { global: true });
  const term = await getCurrentTerm();
  const today = schoolToday();

  const [[activeStudents], [teacherCount], [termSections], [pendingGrades], [attendanceToday], recentActivity, failedLogins] =
    await Promise.all([
      db.select({ n: count }).from(students).where(eq(students.status, "active")),
      db.select({ n: count }).from(teachers),
      db.select({ n: count }).from(sections).where(term ? eq(sections.termId, term.id) : undefined),
      db.select({ n: count }).from(sections).where(inArray(sections.gradeStatus, ["submitted", "approved"])),
      db.select({ n: count }).from(attendanceSessions).where(eq(attendanceSessions.date, today.date)),
      db
        .select({ id: auditLogs.id, action: auditLogs.action, result: auditLogs.result, createdAt: auditLogs.createdAt, actor: users.fullName })
        .from(auditLogs)
        .leftJoin(users, eq(users.id, auditLogs.actorUserId))
        .orderBy(desc(auditLogs.id))
        .limit(8),
      db
        .select({ id: loginHistory.id, identifier: loginHistory.identifier, reason: loginHistory.reason, ip: loginHistory.ip, createdAt: loginHistory.createdAt })
        .from(loginHistory)
        .where(eq(loginHistory.success, false))
        .orderBy(desc(loginHistory.id))
        .limit(5),
    ]);

  return {
    term,
    stats: {
      activeStudents: activeStudents.n,
      teachers: teacherCount.n,
      termSections: termSections.n,
      pendingGrades: pendingGrades.n,
      attendanceToday: attendanceToday.n,
    },
    recentActivity,
    failedLogins,
  };
}

const AUDIT_PAGE_SIZE = 50;

export async function auditLog(user: CurrentUser, query: { action?: string; entity?: string; page: number }) {
  await authorize(user, "audit:read", { global: true });
  const rows = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      before: auditLogs.before,
      after: auditLogs.after,
      result: auditLogs.result,
      reason: auditLogs.reason,
      ip: auditLogs.ip,
      createdAt: auditLogs.createdAt,
      actor: users.fullName,
    })
    .from(auditLogs)
    .leftJoin(users, eq(users.id, auditLogs.actorUserId))
    .where(and(query.action ? like(auditLogs.action, `%${escapeLike(query.action)}%`) : undefined, query.entity ? eq(auditLogs.entityType, query.entity) : undefined))
    .orderBy(desc(auditLogs.id))
    .limit(AUDIT_PAGE_SIZE + 1)
    .offset((query.page - 1) * AUDIT_PAGE_SIZE);
  return { page: query.page, hasNext: rows.length > AUDIT_PAGE_SIZE, items: rows.slice(0, AUDIT_PAGE_SIZE) };
}

export async function teacherDashboard(user: CurrentUser) {
  const scope = await authorize(user, "section:read");
  if (scope === "own") throw forbidden("The teacher portal is for staff.");
  const term = await getCurrentTerm();
  const mine = term ? await listSections(and(eq(sections.termId, term.id), sectionScopeFilter(user, scope))) : [];
  const today = schoolToday();
  return {
    term,
    today: today.date,
    sections: mine,
    todays: mine.filter((s) => s.dayOfWeek === today.weekday),
    returned: mine.filter((s) => s.gradeStatus === "draft" && s.gradeReviewNote),
    students: mine.reduce((n, s) => n + s.enrolled, 0),
  };
}
