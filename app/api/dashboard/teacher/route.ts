import { route } from "@/lib/api/handler";
import { teacherDashboard } from "@/lib/services/dashboards";

export const GET = route(async ({ user }) => teacherDashboard(user));
