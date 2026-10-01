"use client";

import { useState } from "react";
import { UserPlusIcon } from "lucide-react";
import { ConfirmButton } from "@/components/confirm-button";
import { FormDialog } from "@/components/form-dialog";
import { GradeReview } from "@/components/grade-review";
import { EmptyState, PageHeader, QueryView, Section } from "@/components/page";
import { GradeStatusBadge } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApiMutation, useApiQuery } from "@/hooks/use-api";
import type { ApiData } from "@/lib/api/client";
import { formatSchedule } from "@/lib/format";
import type { getAvailableStudents, getSection, getTeacherOptions } from "@/lib/services/sections";

type SectionData = ApiData<typeof getSection>;

export function SectionDetailView({ id }: { id: number }) {
  const query = useApiQuery<SectionData>(`/api/sections/${id}`);
  const drop = useApiMutation<number>((enrollmentId) => `/api/enrollments/${enrollmentId}`, {
    method: "DELETE",
    success: "Student dropped.",
  });

  return (
    <QueryView query={query}>
      {({ section, roster }) => {
        const editable = section.gradeStatus === "draft";
        const showGrades = !editable;
        const full = roster.length >= section.capacity;
        return (
          <>
            <PageHeader
              title={`${section.courseCode}-${section.sectionCode} · ${section.courseTitle}`}
              back={{ href: "/admin/sections", label: "Sections" }}
              description={
                <span className="flex flex-wrap items-center gap-2">
                  {section.yearName} {section.termName} · {formatSchedule(section)} · Room {section.room ?? "—"} · {section.credits} credits
                  <GradeStatusBadge status={section.gradeStatus} />
                </span>
              }
            />

            <div className="grid gap-6 lg:grid-cols-3">
              <Section
                title={`Students (${roster.length}/${section.capacity})`}
                description={!editable ? "Enrollment is closed because grades were submitted." : full ? "This section is full." : undefined}
                className="lg:col-span-2"
                flush
                actions={
                  <FormDialog
                    label="Enroll student"
                    size="sm"
                    icon={<UserPlusIcon />}
                    disabled={!editable || full}
                    title="Enroll a student"
                    description="Capacity and timetable clashes are checked when you enroll."
                  >
                    {(close) => <EnrollStudent sectionId={section.id} onDone={close} />}
                  </FormDialog>
                }
              >
                {roster.length === 0 ? (
                  <EmptyState>No students enrolled yet.</EmptyState>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-4">Student ID</TableHead>
                        <TableHead>Name</TableHead>
                        {showGrades && <TableHead>Score</TableHead>}
                        {showGrades && <TableHead>Grade</TableHead>}
                        <TableHead className="pr-4" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roster.map((r) => (
                        <TableRow key={r.enrollmentId}>
                          <TableCell className="pl-4 font-mono text-xs">{r.studentCode}</TableCell>
                          <TableCell>{r.fullName}</TableCell>
                          {showGrades && <TableCell className="tabular-nums">{r.score ?? "—"}</TableCell>}
                          {showGrades && <TableCell className="font-medium">{r.letter ?? "—"}</TableCell>}
                          <TableCell className="pr-4 text-right">
                            {editable && (
                              <ConfirmButton
                                variant="ghost"
                                size="sm"
                                title={`Drop ${r.fullName}?`}
                                description="The student is removed from this section. You can enroll them again later."
                                confirmLabel="Drop"
                                destructive
                                onConfirm={() => drop.mutate(r.enrollmentId)}
                              >
                                Drop
                              </ConfirmButton>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Section>

              <div className="space-y-6">
                <Section title="Grade review">
                  <GradeReview sectionId={section.id} status={section.gradeStatus} />
                </Section>
                <Section title="Teacher">
                  <AssignTeacher sectionId={section.id} current={section.teacherId} />
                </Section>
              </div>
            </div>
          </>
        );
      }}
    </QueryView>
  );
}

const NONE = "none";

function AssignTeacher({ sectionId, current }: { sectionId: number; current: number | null }) {
  const teachers = useApiQuery<ApiData<typeof getTeacherOptions>>("/api/teachers");
  const [value, setValue] = useState(current ? String(current) : NONE);
  const mutation = useApiMutation<{ teacherId: number | null }>(`/api/sections/${sectionId}/teacher`, {
    method: "PUT",
    success: "Teacher updated.",
  });
  return (
    <div className="space-y-3">
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>— Unassigned —</SelectItem>
          {(teachers.data ?? []).map((t) => (
            <SelectItem key={t.id} value={String(t.id)}>
              {t.name} ({t.employeeId})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        disabled={mutation.isPending || value === (current ? String(current) : NONE)}
        onClick={() => mutation.mutate({ teacherId: value === NONE ? null : Number(value) })}
      >
        Save teacher
      </Button>
    </div>
  );
}

function EnrollStudent({ sectionId, onDone }: { sectionId: number; onDone: () => void }) {
  const students = useApiQuery<ApiData<typeof getAvailableStudents>>(`/api/sections/${sectionId}/enrollments`);
  const [studentId, setStudentId] = useState("");
  const mutation = useApiMutation<{ studentId: number }, { message: string }>(`/api/sections/${sectionId}/enrollments`, {
    success: (d) => d.message,
    onSuccess: onDone,
  });

  const options = students.data ?? [];
  if (students.isSuccess && options.length === 0) {
    return <p className="text-sm text-muted-foreground">All active students are already enrolled.</p>;
  }
  return (
    <div className="space-y-3">
      <Select value={studentId} onValueChange={setStudentId}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Choose a student" />
        </SelectTrigger>
        <SelectContent>
          {options.map((s) => (
            <SelectItem key={s.id} value={String(s.id)}>
              {s.code} — {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button disabled={!studentId || mutation.isPending} onClick={() => mutation.mutate({ studentId: Number(studentId) })}>
          {mutation.isPending ? "Enrolling…" : "Enroll"}
        </Button>
      </div>
    </div>
  );
}
