import { idParam, route } from "@/lib/api/handler";
import { unlockUser } from "@/lib/services/users";

/** POST /api/users/:id/unlock — clear a lockout after too many failed logins. */
export const POST = route(async ({ user, params }) => {
  await unlockUser(user, idParam(params));
});
