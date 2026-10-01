"use client";

import { LayoutDashboardIcon, LogOutIcon, MoonIcon, SunIcon, UserIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Fragment } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { api } from "@/lib/api/client";
import type { TranslationKey } from "@/lib/i18n/dictionaries";
import type { Me } from "@/lib/services/auth";
import { useI18n } from "./i18n-provider";
import { LanguageMenu } from "./language-menu";
import { NotificationBell } from "./notification-bell";

const CRUMBS: Record<string, TranslationKey> = {
  admin: "crumb.admin",
  teacher: "crumb.teacher",
  student: "crumb.student",
  account: "navbar.account",
  users: "nav.users",
  new: "crumb.new",
  organization: "nav.organization",
  academics: "nav.academics",
  courses: "nav.courses",
  sections: "crumb.sections",
  grades: "nav.grades",
  audit: "nav.audit",
  reports: "nav.reports",
  attendance: "nav.attendance",
  timetable: "nav.timetable",
};

const PORTALS: Record<string, { href: string; label: TranslationKey }> = {
  ADMIN: { href: "/admin", label: "portal.admin" },
  TEACHER: { href: "/teacher", label: "portal.teacher" },
  STUDENT: { href: "/student", label: "portal.student" },
};

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

/** Top navbar: sidebar toggle, breadcrumbs, language, theme and the profile menu. */
export function PortalHeader({ me }: { me: Me }) {
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useI18n();

  const segments = pathname.split("/").filter(Boolean);
  const crumbs = segments.map((segment, i) => ({
    href: `/${segments.slice(0, i + 1).join("/")}`,
    label: CRUMBS[segment] ? t(CRUMBS[segment]) : /^\d+$/.test(segment) ? `#${segment}` : segment,
  }));
  // Links to the user's other portals (someone can be both a teacher and an admin).
  const otherPortals = me.roles.map((r) => PORTALS[r.code]).filter((p) => p && !pathname.startsWith(p.href));

  async function logout() {
    try {
      await api("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } catch {
      toast.error(t("navbar.logoutFailed"));
    }
  }

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-1 border-b bg-background/80 px-4 backdrop-blur">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
      <Breadcrumb className="min-w-0 flex-1">
        <BreadcrumbList className="flex-nowrap">
          {crumbs.map((c, i) => (
            <Fragment key={c.href}>
              {i > 0 && <BreadcrumbSeparator className="hidden sm:block" />}
              <BreadcrumbItem className={i < crumbs.length - 1 ? "hidden sm:inline-flex" : "truncate"}>
                {i === crumbs.length - 1 ? (
                  <BreadcrumbPage>{c.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={c.href}>{c.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <NotificationBell />
      <LanguageMenu />

      {/* Theme */}
      <Button variant="ghost" size="icon" aria-label={t("navbar.theme")} onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
        <SunIcon className="scale-100 rotate-0 transition-transform dark:scale-0 dark:-rotate-90" />
        <MoonIcon className="absolute scale-0 rotate-90 transition-transform dark:scale-100 dark:rotate-0" />
      </Button>

      {/* Profile */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="ml-1 h-10 gap-2 px-1.5" aria-label={t("navbar.openMenu")}>
            <Avatar className="size-8">
              <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">{initials(me.fullName)}</AvatarFallback>
            </Avatar>
            <span className="hidden text-left leading-tight md:grid">
              <span className="max-w-40 truncate text-sm font-medium">{me.fullName}</span>
              <span className="max-w-40 truncate text-xs text-muted-foreground">{me.roles.map((r) => r.name).join(", ")}</span>
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-56">
          <DropdownMenuLabel className="font-normal">
            <p className="font-medium">{me.fullName}</p>
            <p className="text-xs text-muted-foreground">{me.email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/account">
              <UserIcon />
              {t("navbar.account")}
            </Link>
          </DropdownMenuItem>
          {otherPortals.map((p) => (
            <DropdownMenuItem key={p.href} asChild>
              <Link href={p.href}>
                <LayoutDashboardIcon />
                {t(p.label)}
              </Link>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={logout} variant="destructive">
            <LogOutIcon />
            {t("navbar.logout")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
