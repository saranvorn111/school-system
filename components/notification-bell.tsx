"use client";

import { BellIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useApiMutation, useApiQuery } from "@/hooks/use-api";
import type { ApiData } from "@/lib/api/client";
import { formatDateTime } from "@/lib/format";
import type { listMyNotifications } from "@/lib/services/notifications";
import { cn } from "@/lib/utils";
import { useT } from "./i18n-provider";

type Inbox = ApiData<typeof listMyNotifications>;

/**
 * Bell in the navbar. It checks for new notifications every 30 seconds —
 * simple polling, which can be replaced by WebSocket/SSE push later without changing the UI.
 */
export function NotificationBell() {
  const t = useT();
  const router = useRouter();
  const inbox = useApiQuery<Inbox>("/api/notifications", { refetchInterval: 30_000 });
  const markRead = useApiMutation<{ id?: number }>("/api/notifications/read");

  const unread = inbox.data?.unread ?? 0;
  const items = inbox.data?.items ?? [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`${t("navbar.notifications")}${unread ? ` (${unread})` : ""}`}>
          <BellIcon />
          {unread > 0 && (
            <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between pr-1">
          <DropdownMenuLabel>{t("navbar.notifications")}</DropdownMenuLabel>
          {unread > 0 && (
            <Button variant="link" size="xs" onClick={() => markRead.mutate({})}>
              {t("navbar.markAllRead")}
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">{t("navbar.noNotifications")}</p>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {items.map((n) => (
              <DropdownMenuItem
                key={n.id}
                className="items-start gap-2 whitespace-normal"
                onSelect={() => {
                  if (!n.readAt) markRead.mutate({ id: n.id });
                  if (n.href) router.push(n.href);
                }}
              >
                <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.readAt ? "bg-transparent" : "bg-primary")} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className={cn("block text-sm", !n.readAt && "font-medium")}>{n.title}</span>
                  {n.body && <span className="block text-xs text-muted-foreground">{n.body}</span>}
                  <span className="block text-xs text-muted-foreground">{formatDateTime(n.createdAt)}</span>
                </span>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
