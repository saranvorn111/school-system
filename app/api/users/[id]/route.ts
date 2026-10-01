import { idParam, readBody, route } from "@/lib/api/handler";
import { getUser, updateUser } from "@/lib/services/users";
import { updateUserSchema } from "@/lib/validation/users";

/** GET /api/users/:id — account, profile, login history. */
export const GET = route(async ({ user, params }) => getUser(user, idParam(params)));

/** PATCH /api/users/:id — edit name and email. */
export const PATCH = route(async ({ req, user, params }) => {
  await updateUser(user, idParam(params), await readBody(req, updateUserSchema));
});
