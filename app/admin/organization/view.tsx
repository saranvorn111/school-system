"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type * as z from "zod";
import { DialogActions, FormDialog } from "@/components/form-dialog";
import { SelectField, TextField } from "@/components/form-fields";
import { useT } from "@/components/i18n-provider";
import { EmptyState, PageHeader, QueryView, Section } from "@/components/page";
import { RowActions } from "@/components/row-actions";
import { ToneBadge } from "@/components/status-badges";
import { FieldGroup } from "@/components/ui/field";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApiMutation, useApiQuery } from "@/hooks/use-api";
import type { ApiData } from "@/lib/api/client";
import type { getDepartments, getPrograms } from "@/lib/services/academics";
import { departmentSchema, programSchema } from "@/lib/validation/academics";

type Departments = ApiData<typeof getDepartments>;
type Programs = ApiData<typeof getPrograms>;

export function OrganizationView() {
  const t = useT();
  const departments = useApiQuery<Departments>("/api/departments");
  const programs = useApiQuery<Programs>("/api/programs");
  const noDepartments = (departments.data ?? []).length === 0;

  return (
    <>
      <PageHeader title={t("page.organization.title")} description={t("page.organization.description")} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Section
          title="Departments"
          description={`${departments.data?.length ?? 0} total`}
          flush
          actions={
            <FormDialog label="Add department" size="sm" title="Add department" description="A faculty unit such as Computer Science.">
              {(close) => <DepartmentForm onDone={close} />}
            </FormDialog>
          }
        >
          <QueryView query={departments}>
            {(rows) =>
              rows.length === 0 ? (
                <EmptyState>No departments yet.</EmptyState>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-4">Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="pr-4" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="pl-4">
                          <ToneBadge tone="blue" className="font-mono normal-case">
                            {d.code}
                          </ToneBadge>
                        </TableCell>
                        <TableCell className="font-medium">{d.name}</TableCell>
                        <TableCell className="pr-4">
                          <RowActions name={d.name} editTitle="Edit department" deletePath={`/api/departments/${d.id}`}>
                            {(close) => <DepartmentForm initial={d} onDone={close} />}
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

        <Section
          title="Programs"
          description={`${programs.data?.length ?? 0} total`}
          flush
          actions={
            <FormDialog
              label="Add program"
              size="sm"
              disabled={noDepartments}
              title="Add program"
              description="A degree program offered by a department."
            >
              {(close) => <ProgramForm departments={departments.data ?? []} onDone={close} />}
            </FormDialog>
          }
        >
          <QueryView query={programs}>
            {(rows) =>
              rows.length === 0 ? (
                <EmptyState>{noDepartments ? "Add a department first, then a program." : "No programs yet."}</EmptyState>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-4">Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead className="pr-4" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="pl-4">
                          <ToneBadge tone="blue" className="font-mono normal-case">
                            {p.code}
                          </ToneBadge>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{p.name}</p>
                          <p className="text-xs capitalize text-muted-foreground">{p.degreeLevel}</p>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{p.departmentName}</TableCell>
                        <TableCell className="pr-4">
                          <RowActions name={p.name} editTitle="Edit program" deletePath={`/api/programs/${p.id}`}>
                            {(close) => <ProgramForm departments={departments.data ?? []} initial={p} onDone={close} />}
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
      </div>
    </>
  );
}

type DepartmentInput = z.input<typeof departmentSchema>;

/** Creates a department, or edits `initial` when given. */
function DepartmentForm({ initial, onDone }: { initial?: Departments[number]; onDone: () => void }) {
  const form = useForm<DepartmentInput>({
    resolver: zodResolver(departmentSchema),
    defaultValues: { code: initial?.code ?? "", name: initial?.name ?? "" },
  });
  const mutation = useApiMutation<DepartmentInput>(initial ? `/api/departments/${initial.id}` : "/api/departments", {
    method: initial ? "PATCH" : "POST",
    form,
    success: initial ? "Department saved." : "Department added.",
    onSuccess: onDone,
  });
  return (
    <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} noValidate>
      <FieldGroup>
        <TextField form={form} name="code" label="Code" placeholder="CS" autoFocus />
        <TextField form={form} name="name" label="Name" placeholder="Computer Science" />
        <DialogActions onCancel={onDone} pending={mutation.isPending} submitLabel={initial ? "Save changes" : "Add department"} />
      </FieldGroup>
    </form>
  );
}

type ProgramInput = z.input<typeof programSchema>;

function ProgramForm({ departments, initial, onDone }: { departments: Departments; initial?: Programs[number]; onDone: () => void }) {
  const form = useForm<ProgramInput>({
    resolver: zodResolver(programSchema),
    defaultValues: {
      code: initial?.code ?? "",
      name: initial?.name ?? "",
      departmentId: initial?.departmentId ?? "",
      degreeLevel: initial?.degreeLevel ?? "bachelor",
    },
  });
  const mutation = useApiMutation<ProgramInput>(initial ? `/api/programs/${initial.id}` : "/api/programs", {
    method: initial ? "PATCH" : "POST",
    form,
    success: initial ? "Program saved." : "Program added.",
    onSuccess: onDone,
  });
  return (
    <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} noValidate>
      <FieldGroup>
        <TextField form={form} name="code" label="Code" placeholder="BSCS" autoFocus />
        <TextField form={form} name="name" label="Name" placeholder="Bachelor of Computer Science" />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField form={form} name="departmentId" label="Department" options={departments.map((d) => ({ value: d.id, label: d.name }))} />
          <SelectField
            form={form}
            name="degreeLevel"
            label="Degree level"
            options={[
              { value: "associate", label: "Associate" },
              { value: "bachelor", label: "Bachelor" },
              { value: "master", label: "Master" },
              { value: "doctorate", label: "Doctorate" },
            ]}
          />
        </div>
        <DialogActions onCancel={onDone} pending={mutation.isPending} submitLabel={initial ? "Save changes" : "Add program"} />
      </FieldGroup>
    </form>
  );
}
