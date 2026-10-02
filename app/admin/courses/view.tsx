"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type * as z from "zod";
import { DialogActions, FormDialog } from "@/components/form-dialog";
import { SelectField, TextareaField, TextField } from "@/components/form-fields";
import { useT } from "@/components/i18n-provider";
import { EmptyState, PageHeader, QueryView, Section } from "@/components/page";
import { RowActions } from "@/components/row-actions";
import { ToneBadge } from "@/components/status-badges";
import { FieldGroup } from "@/components/ui/field";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApiMutation, useApiQuery } from "@/hooks/use-api";
import type { ApiData } from "@/lib/api/client";
import type { getCourses, getDepartments } from "@/lib/services/academics";
import { courseSchema } from "@/lib/validation/academics";

type Courses = ApiData<typeof getCourses>;
type Departments = ApiData<typeof getDepartments>;
type CourseInput = z.input<typeof courseSchema>;

export function CoursesView() {
  const t = useT();
  const courses = useApiQuery<Courses>("/api/courses");
  const departments = useApiQuery<Departments>("/api/departments");

  return (
    <>
      <PageHeader
        title={t("page.courses.title")}
        description={t("page.courses.description")}
        actions={
          <FormDialog label="New course" title="New course" description="Add a course to the catalog.">
            {(close) => <CourseForm departments={departments.data ?? []} onDone={close} />}
          </FormDialog>
        }
      />
      <Section flush>
        <QueryView query={courses}>
          {(rows) =>
            rows.length === 0 ? (
              <EmptyState>No courses yet. Click “New course” to add the first one.</EmptyState>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Code</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="pr-4" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="pl-4">
                        <ToneBadge tone="blue" className="font-mono normal-case">
                          {c.code}
                        </ToneBadge>
                      </TableCell>
                      <TableCell className="font-medium">{c.title}</TableCell>
                      <TableCell className="tabular-nums">{c.credits}</TableCell>
                      <TableCell className="text-muted-foreground">{c.department ?? "—"}</TableCell>
                      <TableCell className="pr-4">
                        <RowActions name={`${c.code} ${c.title}`} editTitle="Edit course" deletePath={`/api/courses/${c.id}`}>
                          {(close) => <CourseForm departments={departments.data ?? []} initial={c} onDone={close} />}
                        </RowActions>
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

/** Creates a course, or edits `initial` when given. */
function CourseForm({ departments, initial, onDone }: { departments: Departments; initial?: Courses[number]; onDone: () => void }) {
  const form = useForm<CourseInput>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      code: initial?.code ?? "",
      title: initial?.title ?? "",
      credits: String(initial?.credits ?? 3),
      departmentId: initial?.departmentId ?? "",
      description: initial?.description ?? "",
    },
  });
  const mutation = useApiMutation<CourseInput>(initial ? `/api/courses/${initial.id}` : "/api/courses", {
    method: initial ? "PATCH" : "POST",
    form,
    success: initial ? "Course saved." : "Course added.",
    onSuccess: onDone,
  });
  return (
    <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} noValidate>
      <FieldGroup>
        <div className="grid grid-cols-2 gap-3">
          <TextField form={form} name="code" label="Code" placeholder="CS201" autoFocus />
          <TextField form={form} name="credits" label="Credits" type="number" min={0} max={12} />
        </div>
        <TextField form={form} name="title" label="Title" placeholder="Data Structures" />
        <SelectField
          form={form}
          name="departmentId"
          label="Department"
          noneLabel="— None —"
          options={departments.map((d) => ({ value: d.id, label: d.name }))}
        />
        <TextareaField form={form} name="description" label="Description" rows={3} />
        <DialogActions onCancel={onDone} pending={mutation.isPending} submitLabel={initial ? "Save changes" : "Add course"} />
      </FieldGroup>
    </form>
  );
}
