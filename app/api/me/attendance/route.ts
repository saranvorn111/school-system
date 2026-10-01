import { route } from "@/lib/api/handler";
import { studentAttendance } from "@/lib/services/student-portal";

/** GET /api/me/attendance — the logged-in student's own data. */
export const GET = route(async ({ user }) => studentAttendance(user));
