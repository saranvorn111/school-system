"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRoundIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type * as z from "zod";
import { ConfirmButton } from "@/components/confirm-button";
import { TextField } from "@/components/form-fields";
import { EmptyState, PageHeader, QueryView, Section } from "@/components/page";
import { ToneBadge, UserStatusBadge } from "@/components/status-badges";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApiMutation, useApiQuery } from "@/hooks/use-api";
import type { ApiData } from "@/lib/api/client";
import { ROLES, type RoleCode } from "@/lib/auth/permissions";
import { formatDate, formatDateTime } from "@/lib/format";
import type { getUser } from "@/lib/services/users";
import { updateUserSchema } from "@/lib/validation/users";

type User = ApiData<typeof getUser>;

export function UserDetailView({ id }: { id: number }) {
  const query = useApiQuery<User>(`/api/users/${id}`);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const reset = useApiMutation<void, { tempPassword: string }>(`/api/users/${id}/reset-password`, {
    onSuccess: (data) => setTempPassword(data.tempPassword),
  });
  const unlock = useApiMutation(`/api/users/${id}/unlock`, { success: "Account unlocked." });
  const setStatus = useApiMutation<{ status: "active" | "disabled" }>(`/api/users/${id}/status`, {
    method: "PUT",
    success: "Account status updated.",
  });

  return (
    <QueryView query={query}>
      {(user) => {
        const profile: [string, string | number | null | undefined][] = user.teacher
          ? [
              ["Employee ID", user.teacher.employeeId],
              ["Department", user.teacher.department],
              ["Title", user.teacher.title],
              ["Phone", user.teacher.phone],
            ]
          : user.student
            ? [
                ["Student ID", user.student.studentCode],
                ["Program", user.student.program],
                ["Admission year", user.student.admissionYear],
                ["Student status", user.student.status],
                ["Gender", user.student.gender],
                ["Date of birth", formatDate(user.student.dateOfBirth)],
                ["Phone", user.student.phone],
              ]
            : [];

        return (
          <>
            <PageHeader
              title={user.fullName}
              back={{ href: "/admin/users", label: "Users" }}
              description={
                <span className="flex flex-wrap items-center gap-1.5">
                  {user.roles.map((r) => (
                    <ToneBadge key={r} tone="blue">
                      {ROLES[r as RoleCode]}
                    </ToneBadge>
                  ))}
                  <UserStatusBadge status={user.status} locked={user.locked} />
                  {user.mustChangePassword && <ToneBadge tone="yellow">temporary password</ToneBadge>}
                </span>
              }
            />

            {tempPassword && (
              <Alert className="mb-6 border-emerald-500/40 bg-emerald-500/5">
                <KeyRoundIcon />
                <AlertTitle>New temporary password</AlertTitle>
                <AlertDescription>
                  <p>
                    <span className="font-mono font-medium text-foreground">{tempPassword}</span> — share it privately. The user must change it
                    at next login and has been signed out everywhere.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <Section title="Account">
                  <EditUserForm id={user.id} fullName={user.fullName} email={user.email} />
                  <p className="mt-4 text-xs text-muted-foreground">
                    Username <span className="font-mono">{user.username}</span> · created {formatDateTime(user.createdAt)} · last login{" "}
                    {formatDateTime(user.lastLoginAt)}
                  </p>
                </Section>

                {profile.length > 0 && (
                  <Section title={user.teacher ? "Teacher profile" : "Student profile"}>
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
                      {profile.map(([label, value]) => (
                        <div key={label}>
                          <dt className="text-xs text-muted-foreground">{label}</dt>
                          <dd className="font-medium capitalize">{value ?? "—"}</dd>
                        </div>
                      ))}
                    </dl>
                  </Section>
                )}

                <Section title="Login history" flush>
                  {user.logins.length === 0 ? (
                    <EmptyState>Never logged in.</EmptyState>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="pl-4">When</TableHead>
                          <TableHead>Result</TableHead>
                          <TableHead className="pr-4">IP</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {user.logins.map((l) => (
                          <TableRow key={l.id}>
                            <TableCell className="pl-4">{formatDateTime(l.createdAt)}</TableCell>
                            <TableCell>
                              {l.success ? <ToneBadge tone="green">success</ToneBadge> : <ToneBadge tone="red">{l.reason?.replace(/_/g, " ")}</ToneBadge>}
                            </TableCell>
                            <TableCell className="pr-4 text-muted-foreground">{l.ip}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </Section>
              </div>

              <div className="space-y-6">
                <Section title="Security actions">
                  <div className="flex flex-col items-start gap-3">
                    <ConfirmButton
                      variant="outline"
                      title="Reset password?"
                      description="A new temporary password is generated and the user is signed out on every device."
                      confirmLabel="Reset password"
                      onConfirm={() => reset.mutate()}
                      pending={reset.isPending}
                    >
                      Reset password
                    </ConfirmButton>
                    {user.locked && (
                      <Button variant="outline" onClick={() => unlock.mutate(undefined)} disabled={unlock.isPending}>
                        Unlock account
                      </Button>
                    )}
                    {!user.isSelf &&
                      (user.status === "active" ? (
                        <ConfirmButton
                          variant="destructive"
                          destructive
                          title="Disable this account?"
                          description="The user can no longer log in and is signed out everywhere. You can enable it again later."
                          confirmLabel="Disable account"
                          onConfirm={() => setStatus.mutate({ status: "disabled" })}
                          pending={setStatus.isPending}
                        >
                          Disable account
                        </ConfirmButton>
                      ) : (
                        <Button variant="outline" onClick={() => setStatus.mutate({ status: "active" })} disabled={setStatus.isPending}>
                          Enable account
                        </Button>
                      ))}
                  </div>
                </Section>

                <Section title="Account changes" flush>
                  {user.history.length === 0 ? (
                    <EmptyState>No changes recorded.</EmptyState>
                  ) : (
                    <ul className="divide-y text-sm">
                      {user.history.map((h) => (
                        <li key={h.id} className="px-4 py-2.5">
                          <p className="font-mono text-xs">{h.action}</p>
                          <p className="text-xs text-muted-foreground">{formatDateTime(h.createdAt)}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </Section>
              </div>
            </div>
          </>
        );
      }}
    </QueryView>
  );
}

type EditInput = z.input<typeof updateUserSchema>;

function EditUserForm({ id, fullName, email }: { id: number; fullName: string; email: string }) {
  const form = useForm<EditInput>({ resolver: zodResolver(updateUserSchema), values: { fullName, email } });
  const mutation = useApiMutation<EditInput>(`/api/users/${id}`, { method: "PATCH", form, success: "Profile saved." });
  return (
    <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} noValidate>
      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField form={form} name="fullName" label="Full name" />
          <TextField form={form} name="email" label="Email" type="email" />
        </div>
        <Button type="submit" variant="outline" className="w-fit" disabled={mutation.isPending || !form.formState.isDirty}>
          Save
        </Button>
      </FieldGroup>
    </form>
  );
}
