"use client";

import { TriangleAlertIcon } from "lucide-react";
import { useState } from "react";
import { ConfirmButton } from "@/components/confirm-button";
import { EmptyState, QueryView, Section } from "@/components/page";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApiMutation, useApiQuery } from "@/hooks/use-api";
import type { ApiData } from "@/lib/api/client";
import { GRADE_SCALE, scoreToGrade } from "@/lib/grading";
import type { getGradeSheet } from "@/lib/services/grades";
import { SectionShell } from "../section-shell";

type Sheet = ApiData<typeof getGradeSheet>;

const STATUS_HELP = {
  draft: "Enter scores and save. When everyone has a score, submit them for approval.",
  submitted: "Submitted and waiting for approval. Scores are locked.",
  approved: "Approved. Waiting to be published to students.",
  published: "Published. Students can see their grades.",
} as const;

export function GradesView({ id }: { id: number }) {
  const query = useApiQuery<Sheet>(`/api/sections/${id}/grades`);
  return (
    <SectionShell id={id}>
      {() => (
        <QueryView query={query}>
          {(sheet) => (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                {sheet.status === "draft" && sheet.reviewNote && (
                  <Alert className="border-amber-500/40 bg-amber-500/5">
                    <TriangleAlertIcon />
                    <AlertDescription>
                      <span>
                        <strong>Sent back for changes:</strong> {sheet.reviewNote}
                      </span>
                    </AlertDescription>
                  </Alert>
                )}
                <Section title="Scores" description={STATUS_HELP[sheet.status]}>
                  {sheet.rows.length === 0 ? (
                    <EmptyState>No students enrolled.</EmptyState>
                  ) : (
                    <GradeSheet key={sheet.rows.map((r) => r.score).join()} sectionId={id} sheet={sheet} />
                  )}
                </Section>
              </div>

              <Section title="Grading scale">
                <table className="w-full text-sm">
                  <tbody>
                    {GRADE_SCALE.map((g, i) => (
                      <tr key={g.letter} className="border-b last:border-0">
                        <td className="py-1.5 font-medium">{g.letter}</td>
                        <td className="py-1.5 text-muted-foreground tabular-nums">
                          {g.min}–{i === 0 ? 100 : GRADE_SCALE[i - 1].min - 0.01}
                        </td>
                        <td className="py-1.5 text-right text-muted-foreground tabular-nums">{g.point.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Section>
            </div>
          )}
        </QueryView>
      )}
    </SectionShell>
  );
}

function letterFor(value: string) {
  if (value.trim() === "") return "—";
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= 100 ? scoreToGrade(n).letter : "?";
}

function GradeSheet({ sectionId, sheet }: { sectionId: number; sheet: Sheet }) {
  const [values, setValues] = useState(() =>
    Object.fromEntries(sheet.rows.map((r) => [r.enrollmentId, r.score === null ? "" : String(r.score)])),
  );
  const save = useApiMutation<unknown, { message: string }>(`/api/sections/${sectionId}/grades`, {
    method: "PUT",
    success: (d) => d.message,
  });
  const submit = useApiMutation(`/api/sections/${sectionId}/grades/submit`, { success: "Grades submitted for approval." });

  const invalid = Object.values(values).some((v) => letterFor(v) === "?");
  const dirty = sheet.rows.some((r) => values[r.enrollmentId] !== (r.score === null ? "" : String(r.score)));
  const missing = sheet.rows.filter((r) => r.score === null).length;

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead className="w-36">Score (0–100)</TableHead>
            <TableHead className="w-16 text-center">Grade</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sheet.rows.map((r) => {
            const value = values[r.enrollmentId];
            return (
              <TableRow key={r.enrollmentId}>
                <TableCell>
                  <p className="font-medium">{r.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">{r.code}</p>
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    max={100}
                    inputMode="decimal"
                    value={value}
                    disabled={!sheet.canEdit}
                    aria-label={`Score for ${r.name}`}
                    aria-invalid={letterFor(value) === "?"}
                    onChange={(e) => setValues((v) => ({ ...v, [r.enrollmentId]: e.target.value }))}
                    className="h-8"
                  />
                </TableCell>
                <TableCell className="text-center font-semibold">{letterFor(value)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {sheet.canEdit && (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            disabled={!dirty || invalid || save.isPending}
            onClick={() =>
              save.mutate({
                scores: sheet.rows.map((r) => ({
                  enrollmentId: r.enrollmentId,
                  score: values[r.enrollmentId].trim() === "" ? null : Number(values[r.enrollmentId]),
                })),
              })
            }
          >
            {save.isPending ? "Saving…" : "Save scores"}
          </Button>
          {sheet.canSubmit && (
            <ConfirmButton
              variant="outline"
              title="Submit grades for approval?"
              description="You won't be able to edit them unless a reviewer sends them back."
              confirmLabel="Submit"
              onConfirm={() => submit.mutate(undefined)}
              pending={submit.isPending}
              disabled={dirty || missing > 0}
            >
              Submit grades
            </ConfirmButton>
          )}
          <span className="text-sm text-muted-foreground">
            {invalid
              ? "Scores must be between 0 and 100."
              : dirty
                ? "Save your changes before submitting."
                : missing
                  ? `${missing} student(s) still have no saved score.`
                  : "All scores saved."}
          </span>
        </div>
      )}
    </div>
  );
}
