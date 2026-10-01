"use client";

import { CalendarCheckIcon, DownloadIcon, GraduationCapIcon, SchoolIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useT } from "@/components/i18n-provider";
import { EmptyState, PageHeader, QueryView, Section, StatCard } from "@/components/page";
import { GradeStatusBadge } from "@/components/status-badges";
import { TermSelect, useTerms } from "@/components/term-select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApiQuery } from "@/hooks/use-api";
import { qs, type ApiData } from "@/lib/api/client";
import type { termReport } from "@/lib/services/reports";
import { cn } from "@/lib/utils";

type Report = ApiData<typeof termReport>;

const pct = (value: number | null) => (value === null ? "—" : `${value}%`);

/** A thin bar that shows a percentage at a glance. */
function Meter({ value, warnBelow }: { value: number | null; warnBelow?: number }) {
  if (value === null) return <span className="text-muted-foreground">—</span>;
  const low = warnBelow !== undefined && value < warnBelow;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", low ? "bg-destructive" : "bg-primary")} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
      <span className={cn("tabular-nums", low && "font-medium text-destructive")}>{value}%</span>
    </div>
  );
}

export function ReportsView() {
  const t = useT();
  const [termId, setTermId] = useState<number>();
  const { current } = useTerms();
  const activeTerm = termId ?? current?.id;
  const query = useApiQuery<Report>(activeTerm ? `/api/reports/term${qs({ termId: activeTerm })}` : null);
  const exportUrl = (kind: string) => `/api/reports/term/export${qs({ kind, termId: activeTerm })}`;

  return (
    <>
      <PageHeader
        title={t("page.reports.title")}
        description={t("page.reports.description")}
        actions={<TermSelect value={termId} onChange={setTermId} />}
      />
      {!activeTerm ? (
        <Section>
          <EmptyState>Create an academic year and term first.</EmptyState>
        </Section>
      ) : (
        <QueryView query={query}>
          {({ sections, atRisk, totals }) => (
            <div className="space-y-6">
              {totals && (
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  <StatCard icon={SchoolIcon} tone="indigo" label="Sections" value={totals.sections} />
                  <StatCard
                    icon={UsersIcon}
                    tone="sky"
                    label="Enrollments"
                    value={totals.enrollments}
                    hint={`${totals.seats} seats · ${pct(totals.seats ? Math.round((totals.enrollments / totals.seats) * 100) : null)} filled`}
                  />
                  <StatCard icon={CalendarCheckIcon} tone="emerald" label="Attendance rate" value={pct(totals.attendanceRate)} />
                  <StatCard
                    icon={GraduationCapIcon}
                    tone="amber"
                    label="Grades published"
                    value={`${totals.published}/${totals.sections}`}
                    hint="sections"
                  />
                </div>
              )}

              <Section
                title="Sections"
                description="Seats filled, attendance and grade results."
                flush
                actions={
                  <Button variant="outline" size="sm" asChild>
                    <a href={exportUrl("sections")} download>
                      <DownloadIcon />
                      Export CSV
                    </a>
                  </Button>
                }
              >
                {sections.length === 0 ? (
                  <EmptyState>No sections in this term.</EmptyState>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-4">Section</TableHead>
                        <TableHead>Teacher</TableHead>
                        <TableHead>Seats</TableHead>
                        <TableHead>Attendance</TableHead>
                        <TableHead>Grades</TableHead>
                        <TableHead>Average</TableHead>
                        <TableHead className="pr-4">Pass rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sections.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="pl-4">
                            <Link href={`/admin/sections/${s.id}`} className="font-medium hover:underline">
                              {s.section}
                            </Link>
                            <p className="text-xs text-muted-foreground">{s.courseTitle}</p>
                          </TableCell>
                          <TableCell>{s.teacher ?? "—"}</TableCell>
                          <TableCell>
                            <span className="tabular-nums">
                              {s.enrolled}/{s.capacity}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Meter value={s.attendanceRate} warnBelow={80} />
                            <p className="text-xs text-muted-foreground">{s.attendanceSessions} session(s)</p>
                          </TableCell>
                          <TableCell>
                            <GradeStatusBadge status={s.gradeStatus} />
                          </TableCell>
                          <TableCell className="tabular-nums">{s.averageScore ?? "—"}</TableCell>
                          <TableCell className="pr-4">
                            <Meter value={s.passRate} warnBelow={50} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Section>

              <Section
                title="Students needing attention"
                description={`Attendance below ${totals?.atRiskThreshold ?? 80}% in a section.`}
                flush
                actions={
                  atRisk.length > 0 && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={exportUrl("at-risk")} download>
                        <DownloadIcon />
                        Export CSV
                      </a>
                    </Button>
                  )
                }
              >
                {atRisk.length === 0 ? (
                  <EmptyState>No students are below the attendance threshold.</EmptyState>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-4">Student</TableHead>
                        <TableHead>Section</TableHead>
                        <TableHead>Attendance</TableHead>
                        <TableHead className="pr-4">Absent</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {atRisk.map((s) => (
                        <TableRow key={`${s.studentId}-${s.section}`}>
                          <TableCell className="pl-4">
                            <p className="font-medium">{s.name}</p>
                            <p className="font-mono text-xs text-muted-foreground">{s.studentCode}</p>
                          </TableCell>
                          <TableCell>{s.section}</TableCell>
                          <TableCell>
                            <Meter value={s.rate} warnBelow={80} />
                          </TableCell>
                          <TableCell className="pr-4 tabular-nums">
                            {s.absent} of {s.total}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Section>
            </div>
          )}
        </QueryView>
      )}
    </>
  );
}
