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
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApiMutation, useApiQuery } from "@/hooks/use-api";
import type { ApiData } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import type { getAcademicYears, getTerms } from "@/lib/services/academics";
import { academicYearSchema, termSchema } from "@/lib/validation/academics";

type Years = ApiData<typeof getAcademicYears>;
type Terms = ApiData<typeof getTerms>;

export function AcademicsView() {
  const t = useT();
  const years = useApiQuery<Years>("/api/academic-years");
  const terms = useApiQuery<Terms>("/api/terms");
  const makeCurrent = useApiMutation<number>((id) => `/api/terms/${id}/current`, { method: "PUT", success: "Current term updated." });
  const noYears = (years.data ?? []).length === 0;

  return (
    <>
      <PageHeader
        title={t("page.academics.title")}
        description={t("page.academics.description")}
        actions={
          <>
            <FormDialog label="Add year" variant="outline" title="Add academic year" description="For example 2027-2028.">
              {(close) => <YearForm onDone={close} />}
            </FormDialog>
            <FormDialog label="Add term" disabled={noYears} title="Add term" description="A semester or term inside an academic year.">
              {(close) => <TermForm years={years.data ?? []} onDone={close} />}
            </FormDialog>
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Section title="Terms" className="lg:col-span-2" flush>
          <QueryView query={terms}>
            {(rows) =>
              rows.length === 0 ? (
                <EmptyState>No terms yet. Add an academic year, then a term.</EmptyState>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-4">Term</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead />
                      <TableHead className="pr-4" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((term) => (
                      <TableRow key={term.id}>
                        <TableCell className="pl-4">
                          <p className="font-medium">{term.name}</p>
                          <p className="text-xs text-muted-foreground">{term.yearName}</p>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(term.startDate)} – {formatDate(term.endDate)}
                        </TableCell>
                        <TableCell>
                          {term.isCurrent ? (
                            <ToneBadge tone="green">Current</ToneBadge>
                          ) : (
                            <Button variant="ghost" size="sm" disabled={makeCurrent.isPending} onClick={() => makeCurrent.mutate(term.id)}>
                              Make current
                            </Button>
                          )}
                        </TableCell>
                        <TableCell className="pr-4">
                          <RowActions
                            name={`${term.yearName} ${term.name}`}
                            editTitle="Edit term"
                            deletePath={`/api/terms/${term.id}`}
                          >
                            {(close) => <TermForm years={years.data ?? []} initial={term} onDone={close} />}
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

        <Section title="Academic years" flush>
          <QueryView query={years}>
            {(rows) =>
              rows.length === 0 ? (
                <EmptyState>No academic years yet.</EmptyState>
              ) : (
                <ul className="divide-y">
                  {rows.map((y) => (
                    <li key={y.id} className="flex items-center justify-between gap-2 px-4 py-3">
                      <div>
                        <p className="font-medium">{y.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(y.startDate)} – {formatDate(y.endDate)}
                        </p>
                      </div>
                      <RowActions name={y.name} editTitle="Edit academic year" deletePath={`/api/academic-years/${y.id}`}>
                        {(close) => <YearForm initial={y} onDone={close} />}
                      </RowActions>
                    </li>
                  ))}
                </ul>
              )
            }
          </QueryView>
        </Section>
      </div>
    </>
  );
}

type YearInput = z.input<typeof academicYearSchema>;

/** Creates an academic year, or edits `initial` when given. */
function YearForm({ initial, onDone }: { initial?: Years[number]; onDone: () => void }) {
  const form = useForm<YearInput>({
    resolver: zodResolver(academicYearSchema),
    defaultValues: { name: initial?.name ?? "", startDate: initial?.startDate ?? "", endDate: initial?.endDate ?? "" },
  });
  const mutation = useApiMutation<YearInput>(initial ? `/api/academic-years/${initial.id}` : "/api/academic-years", {
    method: initial ? "PATCH" : "POST",
    form,
    success: initial ? "Academic year saved." : "Academic year added.",
    onSuccess: onDone,
  });
  return (
    <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} noValidate>
      <FieldGroup>
        <TextField form={form} name="name" label="Name" placeholder="2027-2028" autoFocus />
        <div className="grid grid-cols-2 gap-3">
          <TextField form={form} name="startDate" label="Starts" type="date" />
          <TextField form={form} name="endDate" label="Ends" type="date" />
        </div>
        <DialogActions onCancel={onDone} pending={mutation.isPending} submitLabel={initial ? "Save changes" : "Add year"} />
      </FieldGroup>
    </form>
  );
}

type TermInput = z.input<typeof termSchema>;

function TermForm({ years, initial, onDone }: { years: Years; initial?: Terms[number]; onDone: () => void }) {
  const form = useForm<TermInput>({
    resolver: zodResolver(termSchema),
    defaultValues: {
      academicYearId: initial?.academicYearId ?? years[0]?.id ?? "",
      name: initial?.name ?? "",
      startDate: initial?.startDate ?? "",
      endDate: initial?.endDate ?? "",
    },
  });
  const mutation = useApiMutation<TermInput>(initial ? `/api/terms/${initial.id}` : "/api/terms", {
    method: initial ? "PATCH" : "POST",
    form,
    success: initial ? "Term saved." : "Term added.",
    onSuccess: onDone,
  });
  return (
    <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} noValidate>
      <FieldGroup>
        <SelectField form={form} name="academicYearId" label="Academic year" options={years.map((y) => ({ value: y.id, label: y.name }))} />
        <TextField form={form} name="name" label="Name" placeholder="Semester 2" />
        <div className="grid grid-cols-2 gap-3">
          <TextField form={form} name="startDate" label="Starts" type="date" />
          <TextField form={form} name="endDate" label="Ends" type="date" />
        </div>
        <DialogActions onCancel={onDone} pending={mutation.isPending} submitLabel={initial ? "Save changes" : "Add term"} />
      </FieldGroup>
    </form>
  );
}
