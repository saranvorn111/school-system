"use client";

import { useT } from "@/components/i18n-provider";
import { CalendarDaysIcon, SchoolIcon, TriangleAlertIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { EmptyState, PageHeader, QueryView, Section, StatCard } from "@/components/page";
import { GradeStatusBadge } from "@/components/status-badges";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useApiQuery } from "@/hooks/use-api";
import type { ApiData } from "@/lib/api/client";
import { formatSchedule } from "@/lib/format";
import type { teacherDashboard } from "@/lib/services/dashboards";

export function TeacherDashboardView() {
  const t = useT();
  const query = useApiQuery<ApiData<typeof teacherDashboard>>("/api/dashboard/teacher");
  return (
    <QueryView query={query}>
      {(d) => (
        <>
          <PageHeader title={t("page.teacherDashboard.title")} description={d.term ? `${d.term.yearName} · ${d.term.name}` : "No active term."} />

          {d.returned.length > 0 && (
            <div className="mb-6 space-y-2">
              {d.returned.map((s) => (
                <Alert key={s.id} className="border-amber-500/40 bg-amber-500/5">
                  <TriangleAlertIcon />
                  <AlertDescription>
                    <span>
                      Grades for <strong>{s.courseCode}-{s.sectionCode}</strong> were sent back: “{s.gradeReviewNote}”.{" "}
                      <Link href={`/teacher/sections/${s.id}/grades`} className="font-medium underline">
                        Fix grades
                      </Link>
                    </span>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <StatCard icon={SchoolIcon} tone="indigo" label="My classes" value={d.sections.length} href="/teacher/sections" />
            <StatCard icon={UsersIcon} tone="sky" label="My students" value={d.students} />
            <StatCard icon={CalendarDaysIcon} tone="emerald" label="Classes today" value={d.todays.length} />
          </div>

          <Section title="Today's classes" className="mt-6">
            {d.todays.length === 0 ? (
              <EmptyState>No classes today.</EmptyState>
            ) : (
              <ul className="divide-y">
                {d.todays.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div>
                      <p className="font-medium">
                        {s.startTime}–{s.endTime} · {s.courseCode}-{s.sectionCode} {s.courseTitle}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Room {s.room ?? "—"} · {s.enrolled} students
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <GradeStatusBadge status={s.gradeStatus} />
                      <Button size="sm" asChild>
                        <Link href={`/teacher/sections/${s.id}/attendance`}>Take attendance</Link>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="This week" className="mt-6">
            {d.sections.length === 0 ? (
              <EmptyState>You have no classes assigned this term.</EmptyState>
            ) : (
              <ul className="divide-y">
                {d.sections.map((s) => (
                  <li key={s.id} className="flex items-center justify-between py-3 text-sm">
                    <Link href={`/teacher/sections/${s.id}`} className="font-medium hover:underline">
                      {s.courseCode}-{s.sectionCode} {s.courseTitle}
                    </Link>
                    <span className="text-muted-foreground">{formatSchedule(s)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </>
      )}
    </QueryView>
  );
}
