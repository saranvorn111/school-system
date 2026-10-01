"use client";

import { useT } from "@/components/i18n-provider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type * as z from "zod";
import { DialogActions, FormDialog } from "@/components/form-dialog";
import { SelectField, TextareaField, TextField } from "@/components/form-fields";
import { EmptyState, PageHeader, QueryView, Section } from "@/components/page";
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
                    <TableHead className="pr-4">Department</TableHead>
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
                      <TableCell className="pr-4 text-muted-foreground">{c.department ?? "—"}</TableCell>
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

function CourseForm({ departments, onDone }: { departments: Departments; onDone: () => void }) {
  const form = useForm<CourseInput>({
    resolver: zodResolver(courseSchema),
    defaultValues: { code: "", title: "", credits: "3", departmentId: "", description: "" },
  });
  const create = useApiMutation<CourseInput>("/api/courses", { form, success: "Course added.", onSuccess: onDone });
  return (
    <form onSubmit={form.handleSubmit((v) => create.mutate(v))} noValidate>
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
        <DialogActions onCancel={onDone} pending={create.isPending} submitLabel="Add course" />
      </FieldGroup>
    </form>
  );
}
