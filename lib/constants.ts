// Plain values shared by the database schema, the API and the browser.
// Keep this file free of server-only imports.

export const permissionScopes = ["global", "assigned", "own"] as const;
export type PermissionScope = (typeof permissionScopes)[number];

export const gradeStatuses = ["draft", "submitted", "approved", "published"] as const;
export type GradeStatus = (typeof gradeStatuses)[number];

export const attendanceStatuses = ["present", "late", "absent", "excused"] as const;
export type AttendanceStatus = (typeof attendanceStatuses)[number];

export const userStatuses = ["active", "suspended", "disabled"] as const;
export type UserStatus = (typeof userStatuses)[number];

export const studentStatuses = ["active", "suspended", "graduated", "withdrawn"] as const;
export const genders = ["male", "female", "other"] as const;
export const degreeLevels = ["associate", "bachelor", "master", "doctorate"] as const;
