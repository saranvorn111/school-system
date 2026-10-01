import { route } from "@/lib/api/handler";
import { getTeacherOptions } from "@/lib/services/sections";

/** GET /api/teachers — active teachers, for the assign-teacher picker. */
export const GET = route(async ({ user }) => getTeacherOptions(user));
