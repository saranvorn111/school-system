"use client";

import { useT } from "@/components/i18n-provider";
import Link from "next/link";
import { useState } from "react";
import { EmptyState, PageHeader, QueryView, Section } from "@/components/page";
import { GradeStatusBadge } from "@/components/status-badges";
import { TermSelect, useTerms } from "@/components/term-select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApiQuery } from "@/hooks/use-api";
import { qs, type ApiData } from "@/lib/api/client";
import { formatSchedule } from "@/lib/format";
import type { getSections } from "@/lib/services/sections";

export function TeacherSectionsView() {
  const t = useT();
  const [termId, setTermId] = useState<number>();
  const { current } = useTerms();
  const activeTerm = termId ?? current?.id;
  const query = useApiQuery<ApiData<typeof getSections>>(activeTerm ? `/api/sections${qs({ termId: activeTerm })}` : null);

  return (
    <>
      <PageHeader
        title={t("page.myClasses.title")}
        description={t("page.myClasses.description")}
        actions={<TermSelect value={termId} onChange={setTermId} />}
      />
      <Section flush>
        {!activeTerm ? (
          <EmptyState>No term has been set up yet.</EmptyState>
        ) : (
          <QueryView query={query}>
            {(rows) =>
              rows.length === 0 ? (
                <EmptyState>No classes assigned in this term.</EmptyState>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-4">Class</TableHead>
                      <TableHead>Schedule</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead>Grades</TableHead>
                      <TableHead className="pr-4" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="pl-4">
                          <Link href={`/teacher/sections/${s.id}`} className="font-medium hover:underline">
                            {s.courseCode}-{s.sectionCode}
                          </Link>
                          <p className="text-xs text-muted-foreground">{s.courseTitle}</p>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {formatSchedule(s)}
                          <p className="text-xs text-muted-foreground">Room {s.room ?? "—"}</p>
                        </TableCell>
                        <TableCell className="tabular-nums">{s.enrolled}</TableCell>
                        <TableCell>
                          <GradeStatusBadge status={s.gradeStatus} />
                        </TableCell>
                        <TableCell className="pr-4 text-right whitespace-nowrap">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/teacher/sections/${s.id}/attendance`}>Attendance</Link>
                          </Button>{" "}
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/teacher/sections/${s.id}/grades`}>Grades</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )
            }
          </QueryView>
        )}
      </Section>
    </>
  );
}
