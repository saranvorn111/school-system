"use client";

import {
  BarChart3Icon,
  BookOpenIcon,
  BuildingIcon,
  CalendarCheckIcon,
  CalendarDaysIcon,
  CalendarIcon,
  ClipboardCheckIcon,
  GraduationCapIcon,
  LayoutDashboardIcon,
  ScrollTextIcon,
  SchoolIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import type { Permission } from "@/lib/auth/permissions";
import type { TranslationKey } from "@/lib/i18n/dictionaries";
import type { Me } from "@/lib/services/auth";
import { useT } from "./i18n-provider";

type NavItem = { href: string; label: TranslationKey; icon: LucideIcon; permission?: Permission; exact?: boolean };
export type Portal = "admin" | "teacher" | "student";

const NAV: Record<Portal, { group: TranslationKey; portal: TranslationKey; items: NavItem[] }> = {
  admin: {
    group: "nav.group.admin",
    portal: "portal.admin",
    items: [
      { href: "/admin", label: "nav.dashboard", icon: LayoutDashboardIcon, exact: true },
      { href: "/admin/users", label: "nav.users", icon: UsersIcon, permission: "user:read" },
      { href: "/admin/organization", label: "nav.organization", icon: BuildingIcon, permission: "organization:manage" },
      { href: "/admin/academics", label: "nav.academics", icon: CalendarIcon, permission: "academic:manage" },
      { href: "/admin/courses", label: "nav.courses", icon: BookOpenIcon, permission: "course:create" },
      { href: "/admin/sections", label: "nav.sections", icon: SchoolIcon, permission: "section:create" },
      { href: "/admin/grades", label: "nav.gradeApprovals", icon: ClipboardCheckIcon, permission: "grade:approve" },
      { href: "/admin/reports", label: "nav.reports", icon: BarChart3Icon, permission: "report:read" },
      { href: "/admin/audit", label: "nav.audit", icon: ScrollTextIcon, permission: "audit:read" },
    ],
  },
  teacher: {
    group: "nav.group.teacher",
    portal: "portal.teacher",
    items: [
      { href: "/teacher", label: "nav.dashboard", icon: LayoutDashboardIcon, exact: true },
      { href: "/teacher/sections", label: "nav.myClasses", icon: SchoolIcon, permission: "grade:enter" },
    ],
  },
  student: {
    group: "nav.group.student",
    portal: "portal.student",
    items: [
      { href: "/student", label: "nav.dashboard", icon: LayoutDashboardIcon, exact: true },
      { href: "/student/timetable", label: "nav.timetable", icon: CalendarDaysIcon },
      { href: "/student/attendance", label: "nav.attendance", icon: CalendarCheckIcon, permission: "attendance:read" },
      { href: "/student/grades", label: "nav.grades", icon: GraduationCapIcon, permission: "grade:read" },
    ],
  },
};

/**
 * Portal navigation. Menu items the user has no permission for are hidden;
 * the API still checks every request. The profile menu lives in the top navbar.
 */
export function AppSidebar({ me, portal }: { me: Me; portal: Portal }) {
  const pathname = usePathname();
  const t = useT();
  const nav = NAV[portal];
  const items = nav.items.filter((i) => !i.permission || me.permissions.includes(i.permission));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="h-14">
              <Link href={me.home}>
                {/* Shrinks back to 8 when the sidebar is collapsed to icons. */}
                <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:rounded-lg">
                  <GraduationCapIcon className="size-6 group-data-[collapsible=icon]:size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate text-base font-semibold">{t("app.name")}</span>
                  <span className="truncate text-xs text-muted-foreground">{t(nav.portal)}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t(nav.group)}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
                const label = t(item.label);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={active} tooltip={label}>
                      <Link href={item.href}>
                        <item.icon />
                        <span>{label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
