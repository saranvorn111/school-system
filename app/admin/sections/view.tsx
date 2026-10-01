"use client";

import { useT } from "@/components/i18n-provider";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type * as z from "zod";
import { DialogActions, FormDialog } from "@/components/form-dialog";
import { SelectField, TextField } from "@/components/form-fields";
import { EmptyState, PageHeader, QueryView, Section } from "@/components/page";
import { GradeStatusBadge } from "@/components/status-badges";
import { TermSelect, useTerms } from "@/components/term-select";
import { FieldGroup } from "@/components/ui/field";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApiMutation, useApiQuery } from "@/hooks/use-api";
import { qs, type ApiData } from "@/lib/api/client";
import { DAY_OPTIONS, formatSchedule } from "@/lib/format";
import type { getCourses } from "@/lib/services/academics";
import type { getSections, getTeacherOptions } from "@/lib/services/sections";
import { sectionSchema } from "@/lib/validation/sections";

type Sections = ApiData<typeof getSections>;

export function SectionsView() {
  const t = useT();
  const [termId, setTermId] = useState<number>();
  const { current } = useTerms();
  const activeTerm = termId ?? current?.id;
  const sections = useApiQuery<Sections>(activeTerm ? `/api/sections${qs({ termId: activeTerm })}` : null);

  return (
    <>
      <PageHeader
        title={t("page.sections.title")}
        description={t("page.sections.description")}
        actions={
          <>
            <TermSelect value={termId} onChange={setTermId} />
            {activeTerm && (
              <FormDialog label="New section" title="New section" description="Teacher and room clashes are checked automatically.">
                {(close) => <CreateSectionForm termId={activeTerm} onDone={close} />}
              </FormDialog>
            )}
          </>
        }
      />
      <Section flush>
          {!activeTerm ? (
            <EmptyState>Create an academic year and term first.</EmptyState>
          ) : (
            <QueryView query={sections}>
              {(rows) =>
                rows.length === 0 ? (
                  <EmptyState>No sections in this term yet.</EmptyState>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-4">Section</TableHead>
                        <TableHead>Schedule</TableHead>
                        <TableHead>Teacher</TableHead>
                        <TableHead>Seats</TableHead>
                        <TableHead className="pr-4">Grades</TableHead>
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
                          <TableCell className="whitespace-nowrap">
                            {formatSchedule(s)}
                            <p className="text-xs text-muted-foreground">{s.room ?? "No room"}</p>
                          </TableCell>
                          <TableCell>{s.teacherName ?? <span className="text-amber-600">Unassigned</span>}</TableCell>
                          <TableCell className="tabular-nums">
                            {s.enrolled}/{s.capacity}
                          </TableCell>
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
          )}
      </Section>
    </>
  );
}

type SectionInput = z.input<typeof sectionSchema>;

function CreateSectionForm({ termId, onDone }: { termId: number; onDone: () => void }) {
  const courses = useApiQuery<ApiData<typeof getCourses>>("/api/courses");
  const teachers = useApiQuery<ApiData<typeof getTeacherOptions>>("/api/teachers");
  const defaults: SectionInput = {
    termId,
    courseId: "",
    sectionCode: "A",
    capacity: "40",
    teacherId: "",
    dayOfWeek: "1",
    startTime: "08:00",
    endTime: "09:30",
    room: "",
  };
  const form = useForm<SectionInput>({ resolver: zodResolver(sectionSchema), defaultValues: defaults });
  const mutation = useApiMutation<SectionInput>("/api/sections", {
    form,
    success: "Section created.",
    onSuccess: onDone,
  });

  return (
    <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} noValidate>
      <FieldGroup>
        <SelectField
          form={form}
          name="courseId"
          label="Course"
          placeholder="Choose a course"
          options={(courses.data ?? []).map((c) => ({ value: c.id, label: `${c.code} — ${c.title}` }))}
        />
        <div className="grid grid-cols-2 gap-3">
          <TextField form={form} name="sectionCode" label="Section code" />
          <TextField form={form} name="capacity" label="Capacity" type="number" min={1} />
        </div>
        <SelectField
          form={form}
          name="teacherId"
          label="Teacher"
          noneLabel="— Assign later —"
          options={(teachers.data ?? []).map((t) => ({ value: t.id, label: `${t.name} (${t.employeeId})` }))}
        />
        <div className="grid grid-cols-2 gap-3">
          <SelectField form={form} name="dayOfWeek" label="Day" options={DAY_OPTIONS} />
          <TextField form={form} name="room" label="Room" placeholder="A101" />
          <TextField form={form} name="startTime" label="Starts" type="time" />
          <TextField form={form} name="endTime" label="Ends" type="time" />
        </div>
        <DialogActions onCancel={onDone} pending={mutation.isPending} submitLabel="Create section" />
      </FieldGroup>
    </form>
  );
}
