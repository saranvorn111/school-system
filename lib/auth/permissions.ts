import type { PermissionScope } from "@/lib/constants";

/**
 * Every action the system can check. Format is `resource:action`.
 * Adding a permission: add it here, give it to roles below, run `bun run db:seed`.
 */
export const PERMISSIONS = {
  "user:read": "View user accounts",
  "user:create": "Create user accounts",
  "user:update": "Edit user accounts",
  "user:disable": "Disable or re-enable user accounts",
  "user:reset_password": "Reset passwords and unlock accounts",

  "student:read": "View student profiles",
  "teacher:read": "View teacher profiles",

  "organization:manage": "Manage departments and programs",
  "academic:manage": "Manage academic years and terms",

  "course:read": "View the course catalog",
  "course:create": "Create courses",

  "section:read": "View class sections",
  "section:create": "Create class sections",
  "section:assign_teacher": "Assign teachers to sections",

  "enrollment:read": "View enrollments",
  "enrollment:create": "Enroll students in sections",
  "enrollment:cancel": "Drop students from sections",

  "attendance:read": "View attendance",
  "attendance:mark": "Take attendance",
  "attendance:edit": "Change attendance that was already taken",

  "grade:read": "View grades",
  "grade:enter": "Enter grades",
  "grade:submit": "Submit grades for approval",
  "grade:approve": "Approve or reject submitted grades",
  "grade:publish": "Publish approved grades to students",

  "audit:read": "View the audit log",
  "report:read": "View dashboards and reports",
  "report:export": "Export reports as CSV files",
} as const;

export type Permission = keyof typeof PERMISSIONS;

export const ROLES = {
  ADMIN: "Administrator",
  TEACHER: "Teacher",
  STUDENT: "Student",
} as const;

export type RoleCode = keyof typeof ROLES;

/** Role → permission → scope. This is the permission matrix from the requirements. */
export const ROLE_PERMISSIONS: Record<
  RoleCode,
  Partial<Record<Permission, PermissionScope>>
> = {
  ADMIN: Object.fromEntries(
    Object.keys(PERMISSIONS).map((p) => [p, "global"]),
  ) as Record<Permission, PermissionScope>,

  TEACHER: {
    "student:read": "assigned",
    "course:read": "global",
    "section:read": "assigned",
    "enrollment:read": "assigned",
    "attendance:read": "assigned",
    "attendance:mark": "assigned",
    "attendance:edit": "assigned",
    "grade:read": "assigned",
    "grade:enter": "assigned",
    "grade:submit": "assigned",
  },

  STUDENT: {
    "student:read": "own",
    "course:read": "global",
    "section:read": "own",
    "enrollment:read": "own",
    "attendance:read": "own",
    "grade:read": "own",
  },
};

const scopeRank: Record<PermissionScope, number> = { own: 1, assigned: 2, global: 3 };

/** When a user has several roles, keep the widest scope for each permission. */
export function widestScope(a: PermissionScope | undefined, b: PermissionScope) {
  return !a || scopeRank[b] > scopeRank[a] ? b : a;
}
