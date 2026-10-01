"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircleIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { TextField } from "@/components/form-fields";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { api, ApiClientError } from "@/lib/api/client";
import { loginSchema, type LoginInput } from "@/lib/validation/auth";
import { useT } from "@/components/i18n-provider";

/** Only follow `?next=` inside this app (blocks open redirects like `?next=//evil.com`). */
const safeNext = (next?: string) => (next && next.startsWith("/") && !next.startsWith("//") ? next : undefined);

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const t = useT();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { identifier: "", password: "" } });

  async function onSubmit(values: LoginInput) {
    setError(null);
    try {
      const { redirectTo } = await api<{ redirectTo: string }>("/api/auth/login", { method: "POST", body: values });
      router.replace(redirectTo.startsWith("/account") ? redirectTo : (safeNext(next) ?? redirectTo));
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : t("login.networkError"));
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <TextField form={form} name="identifier" label={t("login.identifier")} autoComplete="username" autoFocus />
        <TextField form={form} name="password" label={t("login.password")} type="password" autoComplete="current-password" />
        {error && (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? t("login.submitting") : t("login.submit")}
        </Button>
      </FieldGroup>
    </form>
  );
}
