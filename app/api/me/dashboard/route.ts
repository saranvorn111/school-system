import { route } from "@/lib/api/handler";
import { studentDashboard } from "@/lib/services/student-portal";

/** GET /api/me/dashboard — the logged-in student's own data. */
export const GET = route(async ({ user }) => studentDashboard(user));
