"use client";

import { useT } from "@/components/i18n-provider";
import Link from "next/link";
import { EmptyState, PageHeader, QueryView, Section } from "@/components/page";
import { GradeStatusBadge } from "@/components/status-badges";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApiQuery } from "@/hooks/use-api";
import type { ApiData } from "@/lib/api/client";
import type { getPendingGradeSections } from "@/lib/services/sections";

export function GradeApprovalsView() {
  const t = useT();
  const query = useApiQuery<ApiData<typeof getPendingGradeSections>>("/api/grades/pending");
  return (
    <>
      <PageHeader title={t("page.gradeApprovals.title")} description={t("page.gradeApprovals.description")} />
      <Section flush>
        <QueryView query={query}>
          {(rows) =>
            rows.length === 0 ? (
              <EmptyState>Nothing waiting for review.</EmptyState>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Section</TableHead>
                    <TableHead>Term</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead className="pr-4">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="pl-4">
                        <Link href={`/admin/sections/${s.id}`} className="font-medium hover:underline">
                          {s.courseCode}-{s.sectionCode}
                        </Link>
                        <p className="text-xs text-muted-foreground">{s.courseTitle}</p>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {s.yearName} {s.termName}
                      </TableCell>
                      <TableCell>{s.teacherName ?? "—"}</TableCell>
                      <TableCell className="tabular-nums">{s.enrolled}</TableCell>
                      <TableCell className="pr-4">
                        <GradeStatusBadge status={s.gradeStatus} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )
          }
        </QueryView>
      </Section>
    </>
  );
}
