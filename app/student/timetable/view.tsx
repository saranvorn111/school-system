"use client";

import { useT } from "@/components/i18n-provider";
import { EmptyState, PageHeader, QueryView, Section } from "@/components/page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApiQuery } from "@/hooks/use-api";
import type { ApiData } from "@/lib/api/client";
import { DAYS } from "@/lib/format";
import type { studentTimetable } from "@/lib/services/student-portal";

export function TimetableView() {
  const t = useT();
  const query = useApiQuery<ApiData<typeof studentTimetable>>("/api/me/timetable");
  return (
    <QueryView query={query}>
      {({ term, sections }) => {
        const days = [1, 2, 3, 4, 5, 6, 7].filter((d) => d <= 5 || sections.some((s) => s.dayOfWeek === d));
        const credits = sections.reduce((n, s) => n + s.credits, 0);
        return (
          <>
            <PageHeader
              title={t("page.timetable.title")}
              description={term ? `${term.yearName} · ${term.name} · ${sections.length} courses · ${credits} credits` : "No active term."}
            />
            {sections.length === 0 ? (
              <Section>
                <EmptyState>You are not enrolled in any course this term.</EmptyState>
              </Section>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {days.map((d) => {
                  const classes = sections.filter((s) => s.dayOfWeek === d);
                  return (
                    <Card key={d} size="sm">
                      <CardHeader>
                        <CardTitle>{DAYS[d]}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {classes.length === 0 ? (
                          <p className="py-4 text-center text-xs text-muted-foreground">No classes</p>
                        ) : (
                          classes.map((s) => (
                            <div key={s.id} className="rounded-md border-l-4 border-primary bg-muted/60 px-3 py-2">
                              <p className="text-xs font-medium tabular-nums">
                                {s.startTime}–{s.endTime}
                              </p>
                              <p className="text-sm font-semibold">{s.courseCode}</p>
                              <p className="text-xs text-muted-foreground">{s.courseTitle}</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {s.room ?? "—"} · {s.teacherName ?? "TBA"}
                              </p>
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        );
      }}
    </QueryView>
  );
}
