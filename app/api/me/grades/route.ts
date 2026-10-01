import { route } from "@/lib/api/handler";
import { studentGrades } from "@/lib/services/student-portal";

/** GET /api/me/grades — the logged-in student's own data. */
export const GET = route(async ({ user }) => studentGrades(user));
