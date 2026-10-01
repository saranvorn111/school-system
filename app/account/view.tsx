"use client";

import { useT } from "@/components/i18n-provider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import type * as z from "zod";
import { ConfirmButton } from "@/components/confirm-button";
import { TextField } from "@/components/form-fields";
import { PageHeader, QueryView, Section } from "@/components/page";
import { ToneBadge } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApiMutation, useApiQuery } from "@/hooks/use-api";
import type { ApiData } from "@/lib/api/client";
import { formatDateTime } from "@/lib/format";
import type { listMySessions, Me } from "@/lib/services/auth";
import { changePasswordSchema } from "@/lib/validation/auth";

type Sessions = ApiData<typeof listMySessions>;
type PasswordInput = z.infer<typeof changePasswordSchema>;

export function AccountView() {
  const t = useT();
  const meQuery = useApiQuery<Me>("/api/auth/me");
  const sessionsQuery = useApiQuery<Sessions>("/api/auth/sessions");
  const router = useRouter();

  const revoke = useApiMutation<string>((id) => `/api/auth/sessions/${id}`, { method: "DELETE", success: "Device signed out." });
  const logoutAll = useApiMutation("/api/auth/logout-all", {
    onSuccess: () => {
      router.replace("/login");
      router.refresh();
    },
  });

  return (
    <>
      <PageHeader title={t("page.account.title")} description={t("page.account.description")} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Profile">
          <QueryView query={meQuery}>
            {(me) => (
              <dl className="grid grid-cols-3 gap-y-3 text-sm">
                <dt className="text-muted-foreground">Name</dt>
                <dd className="col-span-2 font-medium">{me.fullName}</dd>
                <dt className="text-muted-foreground">Username / ID</dt>
                <dd className="col-span-2 font-mono">{me.username}</dd>
                <dt className="text-muted-foreground">Email</dt>
                <dd className="col-span-2">{me.email}</dd>
                <dt className="text-muted-foreground">Roles</dt>
                <dd className="col-span-2 flex gap-1">
                  {me.roles.map((r) => (
                    <ToneBadge key={r.code} tone="blue">
                      {r.name}
                    </ToneBadge>
                  ))}
                </dd>
              </dl>
            )}
          </QueryView>
        </Section>

        <Section title="Change password" description="Changing it signs out your other devices.">
          <ChangePasswordForm />
        </Section>

        <Section
          title="Signed-in devices"
          className="lg:col-span-2"
          flush
          actions={
            <ConfirmButton
              variant="outline"
              size="sm"
              title="Log out of all devices?"
              description="You will be signed out everywhere, including this browser."
              confirmLabel="Log out everywhere"
              onConfirm={() => logoutAll.mutate(undefined)}
              pending={logoutAll.isPending}
            >
              Log out all devices
            </ConfirmButton>
          }
        >
          <QueryView query={sessionsQuery}>
            {(sessions) => (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Device</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Signed in</TableHead>
                    <TableHead>Last active</TableHead>
                    <TableHead className="pr-4" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="max-w-xs truncate pl-4 text-muted-foreground">{s.userAgent ?? "Unknown"}</TableCell>
                      <TableCell>{s.ip}</TableCell>
                      <TableCell>{formatDateTime(s.createdAt)}</TableCell>
                      <TableCell>{formatDateTime(s.lastSeenAt)}</TableCell>
                      <TableCell className="pr-4 text-right">
                        {s.current ? (
                          <ToneBadge tone="green">This device</ToneBadge>
                        ) : (
                          <Button variant="ghost" size="sm" disabled={revoke.isPending} onClick={() => revoke.mutate(s.id)}>
                            Sign out
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </QueryView>
        </Section>
      </div>
    </>
  );
}

function ChangePasswordForm() {
  const form = useForm<PasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });
  const router = useRouter();
  const mutation = useApiMutation<PasswordInput>("/api/auth/password", {
    form,
    success: "Password changed. Other devices have been signed out.",
    onSuccess: () => {
      form.reset();
      router.refresh(); // clears the "temporary password" banner
    },
  });

  return (
    <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} noValidate>
      <FieldGroup>
        <TextField form={form} name="currentPassword" label="Current password" type="password" autoComplete="current-password" />
        <TextField
          form={form}
          name="newPassword"
          label="New password"
          type="password"
          autoComplete="new-password"
          description="At least 8 characters with a letter and a number."
        />
        <TextField form={form} name="confirmPassword" label="Confirm new password" type="password" autoComplete="new-password" />
        <Button type="submit" disabled={mutation.isPending} className="w-fit">
          {mutation.isPending ? "Saving…" : "Change password"}
        </Button>
      </FieldGroup>
    </form>
  );
}
