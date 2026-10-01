import { notFound } from "@/lib/api/errors";
import { route } from "@/lib/api/handler";
import { revokeMySession } from "@/lib/services/auth";

/** DELETE /api/auth/sessions/:id — sign out one of my other devices. */
export const DELETE = route(async ({ user, params }) => {
  const id = params.id;
  if (typeof id !== "string" || !/^[a-f0-9]{64}$/.test(id)) throw notFound();
  await revokeMySession(user, id);
});
