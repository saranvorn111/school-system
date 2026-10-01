import { route, readBody } from "@/lib/api/handler";
import { changePassword } from "@/lib/services/auth";
import { changePasswordSchema } from "@/lib/validation/auth";

/** POST /api/auth/password — change my password (signs out my other devices). */
export const POST = route(async ({ req, user }) => {
  await changePassword(user, await readBody(req, changePasswordSchema));
});
