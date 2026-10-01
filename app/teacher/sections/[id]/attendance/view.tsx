"use client";

import { useState } from "react";
import { EmptyState, QueryView, Section } from "@/components/page";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useApiMutation, useApiQuery } from "@/hooks/use-api";
import { qs, type ApiData } from "@/lib/api/client";
import { attendanceStatuses, type AttendanceStatus } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { getAttendanceSheet } from "@/lib/services/attendance";
import { cn } from "@/lib/utils";
import { SectionShell } from "../section-shell";

type Sheet = ApiData<typeof getAttendanceSheet>;

const ACTIVE: Record<AttendanceStatus, string> = {
  present: "data-[state=on]:bg-emerald-600 data-[state=on]:text-white",
  late: "data-[state=on]:bg-amber-500 data-[state=on]:text-white",
  absent: "data-[state=on]:bg-red-600 data-[state=on]:text-white",
  excused: "data-[state=on]:bg-slate-600 data-[state=on]:text-white",
};

export function AttendanceView({ id }: { id: number }) {
  const [date, setDate] = useState<string>();
  const query = useApiQuery<Sheet>(`/api/sections/${id}/attendance${qs({ date })}`);

  return (
    <SectionShell id={id}>
      {() => (
        <QueryView query={query}>
          {(sheet) => (
            <div className="grid gap-6 lg:grid-cols-3">
              <Section
                className="lg:col-span-2"
                title={`Attendance — ${formatDate(sheet.date)}`}
                description={sheet.taken ? "Already taken. Changes are recorded in the audit log." : "Not taken yet."}
                actions={<Input type="date" value={sheet.date} max={sheet.today} onChange={(e) => e.target.value && setDate(e.target.value)} className="w-auto" />}
              >
                {sheet.students.length === 0 ? (
                  <EmptyState>No students enrolled.</EmptyState>
                ) : (
                  // Remount when the date or saved data changes so the sheet starts from the server's values.
                  <AttendanceSheet key={`${sheet.date}-${sheet.taken}`} sectionId={id} sheet={sheet} />
                )}
              </Section>

              <Section title="Past sessions" flush>
                {sheet.history.length === 0 ? (
                  <EmptyState>No attendance taken yet.</EmptyState>
                ) : (
                  <ul className="divide-y text-sm">
                    {sheet.history.map((h) => (
                      <li key={h.date}>
                        <button
                          type="button"
                          onClick={() => setDate(h.date)}
                          className={cn("block w-full px-4 py-2.5 text-left hover:bg-muted/50", h.date === sheet.date && "bg-muted")}
                        >
                          <p className="font-medium">{formatDate(h.date)}</p>
                          <p className="text-xs text-muted-foreground">
                            {h.present} present · {h.late} late · {h.absent} absent · {h.excused} excused
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            </div>
          )}
        </QueryView>
      )}
    </SectionShell>
  );
}

function AttendanceSheet({ sectionId, sheet }: { sectionId: number; sheet: Sheet }) {
  const [marks, setMarks] = useState(() =>
    Object.fromEntries(sheet.students.map((s) => [s.studentId, { status: s.status, note: s.note }])),
  );
  const save = useApiMutation<unknown, { message: string }>(`/api/sections/${sectionId}/attendance`, {
    method: "PUT",
    success: (d) => d.message,
  });

  const unmarked = sheet.students.filter((s) => !marks[s.studentId]?.status).length;
  const readOnly = !sheet.canSave;
  const set = (studentId: number, patch: Partial<(typeof marks)[number]>) =>
    setMarks((m) => ({ ...m, [studentId]: { ...m[studentId], ...patch } }));

  return (
    <div className="space-y-4">
      {readOnly && (
        <Alert>
          <AlertDescription>You can view this sheet but not change it.</AlertDescription>
        </Alert>
      )}
      {!readOnly && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{unmarked ? `${unmarked} not marked` : "Everyone is marked"}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setMarks((m) => Object.fromEntries(Object.entries(m).map(([k, v]) => [k, { ...v, status: v.status ?? "present" }])))
            }
          >
            Mark the rest present
          </Button>
        </div>
      )}

      <ul className="divide-y rounded-lg border">
        {sheet.students.map((s) => (
          <li key={s.studentId} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
            <div className="min-w-40 flex-1">
              <p className="font-medium">{s.name}</p>
              <p className="font-mono text-xs text-muted-foreground">{s.code}</p>
            </div>
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              disabled={readOnly}
              value={marks[s.studentId]?.status ?? ""}
              onValueChange={(v) => v && set(s.studentId, { status: v as AttendanceStatus })}
              aria-label={`Attendance for ${s.name}`}
            >
              {attendanceStatuses.map((st) => (
                <ToggleGroupItem key={st} value={st} className={cn("capitalize", ACTIVE[st])}>
                  {st}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <Input
              value={marks[s.studentId]?.note ?? ""}
              onChange={(e) => set(s.studentId, { note: e.target.value })}
              placeholder="Note"
              disabled={readOnly}
              aria-label={`Note for ${s.name}`}
              className="h-8 w-40 text-xs"
            />
          </li>
        ))}
      </ul>

      {!readOnly && (
        <Button
          disabled={save.isPending || unmarked > 0}
          onClick={() =>
            save.mutate({
              date: sheet.date,
              records: sheet.students.map((s) => ({
                studentId: s.studentId,
                status: marks[s.studentId].status,
                note: marks[s.studentId].note || null,
              })),
            })
          }
        >
          {save.isPending ? "Saving…" : "Save attendance"}
        </Button>
      )}
    </div>
  );
}
