"use client";

import { useT } from "@/components/i18n-provider";
import { BookOpenIcon, CalendarCheckIcon, CalendarDaysIcon, GraduationCapIcon } from "lucide-react";
import Link from "next/link";
import { EmptyState, PageHeader, QueryView, Section, StatCard } from "@/components/page";
import { Button } from "@/components/ui/button";
import { useApiQuery } from "@/hooks/use-api";
import type { ApiData } from "@/lib/api/client";
import type { studentDashboard } from "@/lib/services/student-portal";

export function StudentDashboardView() {
  const t = useT();
  const query = useApiQuery<ApiData<typeof studentDashboard>>("/api/me/dashboard");
  return (
    <QueryView query={query}>
      {(d) => (
        <>
          <PageHeader title={t("page.studentDashboard.title")} description={d.term ? `${d.term.yearName} · ${d.term.name}` : undefined} />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard icon={BookOpenIcon} tone="indigo" label="Courses this term" value={d.courseCount} href="/student/timetable" />
            <StatCard icon={GraduationCapIcon} tone="emerald" label="Cumulative GPA" value={d.cgpa?.toFixed(2) ?? "—"} hint={`${d.credits} credits earned`} href="/student/grades" />
            <StatCard
              icon={CalendarCheckIcon}
              tone="amber"
              label="Attendance"
              value={d.attendanceRate === null ? "—" : `${d.attendanceRate}%`}
              hint={d.attendanceRate !== null && d.attendanceRate < 80 ? "Below 80% — talk to your advisor" : undefined}
              href="/student/attendance"
            />
            <StatCard icon={CalendarDaysIcon} tone="sky" label="Classes today" value={d.todays.length} />
          </div>

          <Section title="Today's classes" className="mt-6">
            {d.todays.length === 0 ? (
              <EmptyState>No classes today.</EmptyState>
            ) : (
              <ul className="divide-y">
                {d.todays.map((s) => (
                  <li key={s.id} className="py-3">
                    <p className="font-medium">
                      {s.startTime}–{s.endTime} · {s.courseCode} {s.courseTitle}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Room {s.room ?? "—"} · {s.teacherName ?? "Teacher TBA"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {d.latestGrades.length > 0 && (
            <Section
              title="Latest grades"
              className="mt-6"
              actions={
                <Button variant="link" size="sm" asChild>
                  <Link href="/student/grades">All grades</Link>
                </Button>
              }
            >
              <ul className="divide-y">
                {d.latestGrades.map((g) => (
                  <li key={`${g.termId}-${g.courseCode}`} className="flex items-center justify-between py-3 text-sm">
                    <span>
                      <span className="font-medium">{g.courseCode}</span> {g.courseTitle}
                    </span>
                    <span className="font-semibold">{g.letter}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </>
      )}
    </QueryView>
  );
}
