"use client";

import { useT } from "@/components/i18n-provider";
import { PlusIcon, SearchIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { EmptyState, PageHeader, QueryView, Section } from "@/components/page";
import { ToneBadge, UserStatusBadge } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApiQuery } from "@/hooks/use-api";
import { qs, type ApiData } from "@/lib/api/client";
import { ROLES, type RoleCode } from "@/lib/auth/permissions";
import { formatDateTime } from "@/lib/format";
import type { listUsers } from "@/lib/services/users";

type UserList = ApiData<typeof listUsers>;

export function UsersView() {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const role = params.get("role") ?? "";
  const page = Number(params.get("page")) || 1;

  // Filters live in the URL, so a filtered list can be bookmarked or shared.
  const setParams = (next: Record<string, string | number | undefined>) =>
    router.replace(pathname + qs({ q, role, page: undefined, ...next }));

  const query = useApiQuery<UserList>(`/api/users${qs({ q, role, page })}`);

  return (
    <>
      <PageHeader
        title={t("page.users.title")}
        description={t("page.users.description")}
        actions={
          <Button asChild>
            <Link href="/admin/users/new">
              <PlusIcon />
              New user
            </Link>
          </Button>
        }
      />
      <Section flush>
        <form
          className="flex flex-wrap gap-2 px-4 pb-4"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            setParams({ q: String(new FormData(e.currentTarget).get("q") ?? "") });
          }}
        >
          <div className="relative max-w-xs flex-1">
            <SearchIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input name="q" defaultValue={q} placeholder="Search name, email or ID…" className="pl-8" key={q} />
          </div>
          <Select value={role || "ALL"} onValueChange={(v) => setParams({ role: v === "ALL" ? undefined : v })}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All roles</SelectItem>
              {Object.entries(ROLES).map(([code, label]) => (
                <SelectItem key={code} value={code}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>

        <QueryView query={query}>
          {(data) =>
            data.items.length === 0 ? (
              <EmptyState>No users match.</EmptyState>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-4">Name</TableHead>
                      <TableHead>Username / ID</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="pr-4">Last login</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.items.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="pl-4">
                          <Link href={`/admin/users/${u.id}`} className="font-medium hover:underline">
                            {u.fullName}
                          </Link>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{u.username}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {u.roles.map((r) => (
                              <ToneBadge key={r} tone="blue">
                                {ROLES[r as RoleCode] ?? r}
                              </ToneBadge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <UserStatusBadge status={u.status} locked={u.locked} />
                        </TableCell>
                        <TableCell className="pr-4 text-muted-foreground">{formatDateTime(u.lastLoginAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {(page > 1 || data.hasNext) && (
                  <div className="flex justify-between px-4 pt-4">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setParams({ page: page - 1 })}>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" disabled={!data.hasNext} onClick={() => setParams({ page: page + 1 })}>
                      Next
                    </Button>
                  </div>
                )}
              </>
            )
          }
        </QueryView>
      </Section>
    </>
  );
}
