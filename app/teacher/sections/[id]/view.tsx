"use client";

import { EmptyState, Section } from "@/components/page";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SectionShell } from "./section-shell";

export function TeacherSectionView({ id }: { id: number }) {
  return (
    <SectionShell id={id}>
      {({ roster }) => (
        <Section title={`Students (${roster.length})`} flush>
          {roster.length === 0 ? (
            <EmptyState>No students are enrolled yet.</EmptyState>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Student ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="pr-4">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roster.map((r) => (
                  <TableRow key={r.enrollmentId}>
                    <TableCell className="pl-4 font-mono text-xs">{r.studentCode}</TableCell>
                    <TableCell className="font-medium">{r.fullName}</TableCell>
                    <TableCell className="text-muted-foreground">{r.email}</TableCell>
                    <TableCell className="pr-4 tabular-nums">{r.score ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Section>
      )}
    </SectionShell>
  );
}
