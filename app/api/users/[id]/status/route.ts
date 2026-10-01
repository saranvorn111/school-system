import { idParam, readBody, route } from "@/lib/api/handler";
import { setUserStatus } from "@/lib/services/users";
import { userStatusSchema } from "@/lib/validation/users";

/** PUT /api/users/:id/status — { status: "active" | "disabled" } */
export const PUT = route(async ({ req, user, params }) => {
  const { status } = await readBody(req, userStatusSchema);
  await setUserStatus(user, idParam(params), status);
});
