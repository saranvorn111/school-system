import { route } from "@/lib/api/handler";
import { studentTimetable } from "@/lib/services/student-portal";

/** GET /api/me/timetable — the logged-in student's own data. */
export const GET = route(async ({ user }) => studentTimetable(user));
