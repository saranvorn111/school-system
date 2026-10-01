import { route } from "@/lib/api/handler";
import { me } from "@/lib/services/auth";

/** GET /api/auth/me — the logged-in user, roles and permissions. */
export const GET = route(async ({ user }) => me(user));
