"use client";

import { useT } from "@/components/i18n-provider";
import { BookOpenIcon, GraduationCapIcon } from "lucide-react";
import { EmptyState, PageHeader, QueryView, Section, StatCard } from "@/components/page";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApiQuery } from "@/hooks/use-api";
import type { ApiData } from "@/lib/api/client";
import type { studentGrades } from "@/lib/services/student-portal";

export function StudentGradesView() {
  const t = useT();
  const query = useApiQuery<ApiData<typeof studentGrades>>("/api/me/grades");
  return (
    <>
      <PageHeader title={t("page.myGrades.title")} description={t("page.myGrades.description")} />
      <QueryView query={query}>
        {({ cgpa, credits, terms }) => (
          <>
            <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard icon={GraduationCapIcon} tone="emerald" label="Cumulative GPA" value={cgpa?.toFixed(2) ?? "—"} />
              <StatCard icon={BookOpenIcon} tone="indigo" label="Credits earned" value={credits} />
            </div>
            {terms.length === 0 ? (
              <Section>
                <EmptyState>No published grades yet.</EmptyState>
              </Section>
            ) : (
              <div className="space-y-6">
                {terms.map((t) => (
                  <Section
                    key={t.termId}
                    title={t.label}
                    flush
                    actions={
                      <span className="text-sm text-muted-foreground">
                        Term GPA <strong className="text-foreground">{t.gpa?.toFixed(2)}</strong>
                      </span>
                    }
                  >
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="pl-4">Course</TableHead>
                          <TableHead>Credits</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead>Grade</TableHead>
                          <TableHead className="pr-4">Points</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {t.courses.map((g) => (
                          <TableRow key={g.courseCode}>
                            <TableCell className="pl-4">
                              <p className="font-medium">{g.courseCode}</p>
                              <p className="text-xs text-muted-foreground">{g.courseTitle}</p>
                            </TableCell>
                            <TableCell className="tabular-nums">{g.credits}</TableCell>
                            <TableCell className="tabular-nums">{g.score}</TableCell>
                            <TableCell className="font-semibold">{g.letter}</TableCell>
                            <TableCell className="pr-4 tabular-nums">{g.gradePoint.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Section>
                ))}
              </div>
            )}
          </>
        )}
      </QueryView>
    </>
  );
}
