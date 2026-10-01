"use client";

import { useT } from "@/components/i18n-provider";
import { CalendarCheckIcon, ClipboardCheckIcon, GraduationCapIcon, SchoolIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { EmptyState, PageHeader, QueryView, Section, StatCard } from "@/components/page";
import { ToneBadge } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { useApiQuery } from "@/hooks/use-api";
import type { ApiData } from "@/lib/api/client";
import { formatDateTime } from "@/lib/format";
import type { adminDashboard } from "@/lib/services/dashboards";

type Dashboard = ApiData<typeof adminDashboard>;

export function AdminDashboardView() {
  const t = useT();
  const query = useApiQuery<Dashboard>("/api/dashboard/admin");
  return (
    <QueryView query={query}>
      {({ term, stats, recentActivity, failedLogins }) => (
        <>
          <PageHeader title={t("page.adminDashboard.title")} description={term ? `Current term: ${term.yearName} · ${term.name}` : "No term set up yet."} />

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5">
            <StatCard icon={GraduationCapIcon} tone="indigo" label="Active students" value={stats.activeStudents} href="/admin/users?role=STUDENT" />
            <StatCard icon={UsersIcon} tone="sky" label="Teachers" value={stats.teachers} href="/admin/users?role=TEACHER" />
            <StatCard icon={SchoolIcon} tone="emerald" label="Sections this term" value={stats.termSections} href="/admin/sections" />
            <StatCard
              icon={ClipboardCheckIcon}
              tone="amber"
              label="Grades awaiting review"
              value={stats.pendingGrades}
              href="/admin/grades"
              hint={stats.pendingGrades ? "Needs action" : "All clear"}
            />
            <StatCard icon={CalendarCheckIcon} tone="rose" label="Attendance taken today" value={stats.attendanceToday} hint="class sessions" />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <Section
              title="Recent activity"
              className="lg:col-span-2"
              flush
              actions={
                <Button variant="link" size="sm" asChild>
                  <Link href="/admin/audit">View all</Link>
                </Button>
              }
            >
              {recentActivity.length === 0 ? (
                <EmptyState>No activity yet.</EmptyState>
              ) : (
                <Table>
                  <TableBody>
                    {recentActivity.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="pl-4">
                          <span className="font-mono text-xs">{a.action}</span>
                          {a.result === "failure" && (
                            <ToneBadge tone="red" className="ml-2">
                              failed
                            </ToneBadge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{a.actor ?? "System"}</TableCell>
                        <TableCell className="pr-4 text-right text-muted-foreground">{formatDateTime(a.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Section>

            <Section title="Failed logins" flush>
              {failedLogins.length === 0 ? (
                <EmptyState>No failed logins.</EmptyState>
              ) : (
                <Table>
                  <TableBody>
                    {failedLogins.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="pl-4">
                          <p className="font-medium">{l.identifier}</p>
                          <p className="text-xs whitespace-normal text-muted-foreground">
                            {l.reason?.replace(/_/g, " ")} · {formatDateTime(l.createdAt)} · {l.ip}
                          </p>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Section>
          </div>
        </>
      )}
    </QueryView>
  );
}
