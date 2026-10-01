"use client";

import { useT } from "@/components/i18n-provider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type * as z from "zod";
import { DialogActions, FormDialog } from "@/components/form-dialog";
import { SelectField, TextField } from "@/components/form-fields";
import { EmptyState, PageHeader, QueryView, Section } from "@/components/page";
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
                      <TableHead className="pr-4" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="pl-4">
                          <p className="font-medium">{t.name}</p>
                          <p className="text-xs text-muted-foreground">{t.yearName}</p>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(t.startDate)} – {formatDate(t.endDate)}
                        </TableCell>
                        <TableCell className="pr-4 text-right">
                          {t.isCurrent ? (
                            <ToneBadge tone="green">Current</ToneBadge>
                          ) : (
                            <Button variant="ghost" size="sm" disabled={makeCurrent.isPending} onClick={() => makeCurrent.mutate(t.id)}>
                              Make current
                            </Button>
                          )}
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
                    <li key={y.id} className="px-4 py-3">
                      <p className="font-medium">{y.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(y.startDate)} – {formatDate(y.endDate)}
                      </p>
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

function YearForm({ onDone }: { onDone: () => void }) {
  const form = useForm<YearInput>({ resolver: zodResolver(academicYearSchema), defaultValues: { name: "", startDate: "", endDate: "" } });
  const mutation = useApiMutation<YearInput>("/api/academic-years", { form, success: "Academic year added.", onSuccess: onDone });
  return (
    <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} noValidate>
      <FieldGroup>
        <TextField form={form} name="name" label="Name" placeholder="2027-2028" autoFocus />
        <div className="grid grid-cols-2 gap-3">
          <TextField form={form} name="startDate" label="Starts" type="date" />
          <TextField form={form} name="endDate" label="Ends" type="date" />
        </div>
        <DialogActions onCancel={onDone} pending={mutation.isPending} submitLabel="Add year" />
      </FieldGroup>
    </form>
  );
}

type TermInput = z.input<typeof termSchema>;

function TermForm({ years, onDone }: { years: Years; onDone: () => void }) {
  const form = useForm<TermInput>({
    resolver: zodResolver(termSchema),
    defaultValues: { academicYearId: years[0]?.id ?? "", name: "", startDate: "", endDate: "" },
  });
  const mutation = useApiMutation<TermInput>("/api/terms", { form, success: "Term added.", onSuccess: onDone });
  return (
    <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} noValidate>
      <FieldGroup>
        <SelectField form={form} name="academicYearId" label="Academic year" options={years.map((y) => ({ value: y.id, label: y.name }))} />
        <TextField form={form} name="name" label="Name" placeholder="Semester 2" />
        <div className="grid grid-cols-2 gap-3">
          <TextField form={form} name="startDate" label="Starts" type="date" />
          <TextField form={form} name="endDate" label="Ends" type="date" />
        </div>
        <DialogActions onCancel={onDone} pending={mutation.isPending} submitLabel="Add term" />
      </FieldGroup>
    </form>
  );
}
