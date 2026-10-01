"use client";

import { useT } from "@/components/i18n-provider";
import { EmptyState, PageHeader, QueryView, Section } from "@/components/page";
import { AttendanceBadge } from "@/components/status-badges";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApiQuery } from "@/hooks/use-api";
import type { ApiData } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import type { studentAttendance } from "@/lib/services/student-portal";
import { cn } from "@/lib/utils";

export function StudentAttendanceView() {
  const t = useT();
  const query = useApiQuery<ApiData<typeof studentAttendance>>("/api/me/attendance");
  return (
    <>
      <PageHeader title={t("page.myAttendance.title")} description={t("page.myAttendance.description")} />
      <QueryView query={query}>
        {({ bySection, recent }) => (
          <div className="grid gap-6 lg:grid-cols-2">
            <Section title="By course" flush>
              {bySection.length === 0 ? (
                <EmptyState>No attendance recorded yet.</EmptyState>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-4">Course</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Absent</TableHead>
                      <TableHead className="pr-4">Late</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bySection.map((a) => (
                      <TableRow key={a.sectionId}>
                        <TableCell className="pl-4">
                          <p className="font-medium">{a.courseCode}-{a.sectionCode}</p>
                          <p className="text-xs text-muted-foreground">{a.courseTitle}</p>
                        </TableCell>
                        <TableCell className={cn("font-semibold tabular-nums", a.rate !== null && a.rate < 80 && "text-destructive")}>
                          {a.rate}%
                        </TableCell>
                        <TableCell className="tabular-nums">{a.absent}</TableCell>
                        <TableCell className="pr-4 tabular-nums">{a.late}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Section>

            <Section title="Recent classes" flush>
              {recent.length === 0 ? (
                <EmptyState>Nothing yet.</EmptyState>
              ) : (
                <ul className="divide-y text-sm">
                  {recent.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                      <div>
                        <p className="font-medium">
                          {r.courseCode} <span className="font-normal text-muted-foreground">· {formatDate(r.date)}</span>
                        </p>
                        {r.note && <p className="text-xs text-muted-foreground">{r.note}</p>}
                      </div>
                      <AttendanceBadge status={r.status} />
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </div>
        )}
      </QueryView>
    </>
  );
}
