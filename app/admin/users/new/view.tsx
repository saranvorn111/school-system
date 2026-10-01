"use client";

import { useT } from "@/components/i18n-provider";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2Icon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { SelectField, TextField } from "@/components/form-fields";
import { PageHeader, Section } from "@/components/page";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useApiMutation, useApiQuery } from "@/hooks/use-api";
import type { ApiData } from "@/lib/api/client";
import type { createUser } from "@/lib/services/users";
import type { getDepartments, getPrograms } from "@/lib/services/academics";
import { createUserSchema, type CreateUserInput } from "@/lib/validation/users";

type Created = ApiData<typeof createUser>;
type Role = CreateUserInput["role"];

const EMPTY = {
  fullName: "",
  email: "",
  username: "",
  employeeId: "",
  departmentId: "",
  title: "",
  phone: "",
  studentCode: "",
  programId: "",
  admissionYear: String(new Date().getFullYear()),
  gender: "",
  dateOfBirth: "",
};

export function NewUserView() {
  const t = useT();
  const [role, setRole] = useState<Role>("STUDENT");
  const [created, setCreated] = useState<(Created & { fullName: string }) | null>(null);
  const departments = useApiQuery<ApiData<typeof getDepartments>>("/api/departments");
  const programs = useApiQuery<ApiData<typeof getPrograms>>("/api/programs");

  // One form for all three roles; the discriminated schema only validates the fields of the chosen role.
  const form = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: "STUDENT", ...EMPTY } as CreateUserInput,
  });
  const mutation = useApiMutation<CreateUserInput, Created>("/api/users", {
    form,
    onSuccess: (data, body) => {
      setCreated({ ...data, fullName: body.fullName });
      form.reset({ role, ...EMPTY } as CreateUserInput);
    },
  });

  const pickRole = (r: string) => {
    if (!r) return;
    setRole(r as Role);
    form.setValue("role", r as Role);
    form.clearErrors();
  };

  return (
    <>
      <PageHeader
        title={t("page.newUser.title")}
        description={t("page.newUser.description")}
        back={{ href: "/admin/users", label: "Users" }}
      />

      {created && (
        <Alert className="mb-6 border-emerald-500/40 bg-emerald-500/5">
          <CheckCircle2Icon />
          <AlertTitle>Account created for {created.fullName}</AlertTitle>
          <AlertDescription>
            <p>
              Username <span className="font-mono font-medium text-foreground">{created.username}</span> · temporary password{" "}
              <span className="font-mono font-medium text-foreground">{created.tempPassword}</span>
            </p>
            <p>Share it privately; it won&apos;t be shown again. </p>
            <Link href={`/admin/users/${created.id}`} className="font-medium underline">
              Open account
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <Section>
        <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} noValidate>
          <FieldGroup>
            <ToggleGroup type="single" variant="outline" value={role} onValueChange={pickRole} className="w-fit">
              <ToggleGroupItem value="STUDENT">Student</ToggleGroupItem>
              <ToggleGroupItem value="TEACHER">Teacher</ToggleGroupItem>
              <ToggleGroupItem value="ADMIN">Admin</ToggleGroupItem>
            </ToggleGroup>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <TextField form={form} name="fullName" label="Full name" />
              <TextField form={form} name="email" label="Email" type="email" />
            </div>

            {role === "ADMIN" && <TextField form={form} name="username" label="Username" description="Used to log in." />}

            {role === "TEACHER" && (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <TextField form={form} name="employeeId" label="Employee ID" description="Also their login username." />
                <SelectField
                  form={form}
                  name="departmentId"
                  label="Department"
                  noneLabel="— None —"
                  options={(departments.data ?? []).map((d) => ({ value: d.id, label: `${d.code} — ${d.name}` }))}
                />
                <TextField form={form} name="title" label="Title" placeholder="Lecturer" />
                <TextField form={form} name="phone" label="Phone" type="tel" />
              </div>
            )}

            {role === "STUDENT" && (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <TextField form={form} name="studentCode" label="Student ID" description="Also their login username." />
                <SelectField
                  form={form}
                  name="programId"
                  label="Program"
                  noneLabel="— None —"
                  options={(programs.data ?? []).map((p) => ({ value: p.id, label: `${p.code} — ${p.name}` }))}
                />
                <TextField form={form} name="admissionYear" label="Admission year" type="number" />
                <SelectField
                  form={form}
                  name="gender"
                  label="Gender"
                  noneLabel="—"
                  options={[
                    { value: "male", label: "Male" },
                    { value: "female", label: "Female" },
                    { value: "other", label: "Other" },
                  ]}
                />
                <TextField form={form} name="dateOfBirth" label="Date of birth" type="date" />
                <TextField form={form} name="phone" label="Phone" type="tel" />
              </div>
            )}

            <Button type="submit" disabled={mutation.isPending} className="w-fit">
              {mutation.isPending ? "Creating…" : "Create account"}
            </Button>
          </FieldGroup>
        </form>
      </Section>
    </>
  );
}
