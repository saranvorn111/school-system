"use client";

import { useT } from "@/components/i18n-provider";
import { useState } from "react";
import { EmptyState, PageHeader, QueryView, Section } from "@/components/page";
import { ToneBadge } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApiQuery } from "@/hooks/use-api";
import { qs, type ApiData } from "@/lib/api/client";
import { formatDateTime } from "@/lib/format";
import type { auditLog } from "@/lib/services/dashboards";

const ENTITIES = ["user", "section", "enrollment", "attendance_session", "course", "term", "department", "program", "permission"];

function summarize(value: unknown) {
  if (value == null) return null;
  const text = JSON.stringify(value);
  return text.length > 120 ? `${text.slice(0, 117)}…` : text;
}

export function AuditView() {
  const t = useT();
  const [filters, setFilters] = useState({ action: "", entity: "", page: 1 });
  const query = useApiQuery<ApiData<typeof auditLog>>(`/api/audit-logs${qs(filters)}`);

  return (
    <>
      <PageHeader title={t("page.audit.title")} description={t("page.audit.description")} />
      <Section flush>
        <form
          className="flex flex-wrap gap-2 px-4 pb-4"
          onSubmit={(e) => {
            e.preventDefault();
            // Read the input now: inside the state updater below, e.currentTarget is already null.
            const action = String(new FormData(e.currentTarget).get("action") ?? "").trim();
            setFilters((f) => ({ ...f, action, page: 1 }));
          }}
        >
          <Input name="action" defaultValue={filters.action} placeholder="Action, e.g. grade or logout" className="max-w-xs" />
          <Select value={filters.entity || "all"} onValueChange={(v) => setFilters((f) => ({ ...f, entity: v === "all" ? "" : v, page: 1 }))}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All records</SelectItem>
              {ENTITIES.map((e) => (
                <SelectItem key={e} value={e}>
                  {e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit" variant="outline">
            Filter
          </Button>
        </form>

        <QueryView query={query}>
          {(data) =>
            data.items.length === 0 ? (
              <EmptyState>No audit records match.</EmptyState>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-4">When</TableHead>
                      <TableHead>Who</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Record</TableHead>
                      <TableHead className="pr-4">Change</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.items.map((r) => (
                      <TableRow key={r.id} className="align-top">
                        <TableCell className="pl-4 whitespace-nowrap text-muted-foreground">
                          {formatDateTime(r.createdAt)}
                          <p className="text-xs">{r.ip}</p>
                        </TableCell>
                        <TableCell>{r.actor ?? <span className="text-muted-foreground">System</span>}</TableCell>
                        <TableCell>
                          <span className="font-mono text-xs">{r.action}</span>
                          {r.result === "failure" && (
                            <ToneBadge tone="red" className="ml-1">
                              failed
                            </ToneBadge>
                          )}
                          {r.reason && <p className="text-xs text-muted-foreground">{r.reason}</p>}
                        </TableCell>
                        <TableCell className="font-mono text-xs whitespace-nowrap">
                          {r.entityType}
                          {r.entityId && `#${r.entityId}`}
                        </TableCell>
                        <TableCell className="min-w-72 max-w-md pr-4 font-mono text-xs break-all whitespace-normal">
                          {summarize(r.before) && <p className="text-destructive">− {summarize(r.before)}</p>}
                          {summarize(r.after) && <p className="text-emerald-700 dark:text-emerald-400">+ {summarize(r.after)}</p>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex justify-between px-4 pt-4">
                  <Button variant="outline" size="sm" disabled={filters.page <= 1} onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}>
                    Newer
                  </Button>
                  <Button variant="outline" size="sm" disabled={!data.hasNext} onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}>
                    Older
                  </Button>
                </div>
              </>
            )
          }
        </QueryView>
      </Section>
    </>
  );
}
