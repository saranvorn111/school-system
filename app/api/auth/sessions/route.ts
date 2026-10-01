import { route } from "@/lib/api/handler";
import { listMySessions } from "@/lib/services/auth";

/** GET /api/auth/sessions — my signed-in devices. */
export const GET = route(async ({ user }) => listMySessions(user));
