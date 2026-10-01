import { route } from "@/lib/api/handler";
import { adminDashboard } from "@/lib/services/dashboards";

export const GET = route(async ({ user }) => adminDashboard(user));
