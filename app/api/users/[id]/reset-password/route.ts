import { idParam, route } from "@/lib/api/handler";
import { resetUserPassword } from "@/lib/services/users";

/** POST /api/users/:id/reset-password — returns a one-time temporary password. */
export const POST = route(async ({ user, params }) => resetUserPassword(user, idParam(params)));
