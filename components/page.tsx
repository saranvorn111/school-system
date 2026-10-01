"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import { AlertCircleIcon, ArrowLeftIcon, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiClientError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-6 space-y-2">
      {back && (
        <Link href={back.href} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeftIcon className="size-3.5" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && <div className="text-sm text-muted-foreground">{description}</div>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

const statTones = {
  indigo: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  sky: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
} as const;

export function StatCard({
  label,
  value,
  hint,
  href,
  icon: Icon,
  tone = "indigo",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  href?: string;
  icon?: LucideIcon;
  tone?: keyof typeof statTones;
}) {
  const card = (
    <Card className={cn("h-full shadow-xs", href && "transition hover:-translate-y-0.5 hover:shadow-md")}>
      <CardContent className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        {Icon && (
          <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", statTones[tone])}>
            <Icon className="size-5" />
          </div>
        )}
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{card}</Link> : card;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="py-10 text-center text-sm text-muted-foreground">{children}</p>;
}

export function ErrorState({ error }: { error: ApiClientError | Error }) {
  return (
    <Alert variant="destructive">
      <AlertCircleIcon />
      <AlertTitle>{"status" in error && error.status === 403 ? "Access denied" : "Couldn't load this page"}</AlertTitle>
      <AlertDescription>{error.message}</AlertDescription>
    </Alert>
  );
}

export function LoadingState() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-8 w-64" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

/** Renders loading / error / data for a query, so every page handles all three states. */
export function QueryView<T>({ query, children }: { query: UseQueryResult<T, ApiClientError>; children: (data: T) => ReactNode }) {
  if (query.isPending) return <LoadingState />;
  if (query.isError) return <ErrorState error={query.error} />;
  return <>{children(query.data)}</>;
}

/** Card with a title row; `flush` removes the inner padding for full-width tables. */
export function Section({
  title,
  description,
  actions,
  children,
  className,
  flush = false,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  flush?: boolean;
}) {
  return (
    <Card className={cn("shadow-xs", className)}>
      {(title || actions) && (
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <div className="space-y-1">
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {actions}
        </CardHeader>
      )}
      <CardContent className={flush ? "px-0" : undefined}>{children}</CardContent>
    </Card>
  );
}
