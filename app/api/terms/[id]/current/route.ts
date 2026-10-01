import { idParam, route } from "@/lib/api/handler";
import { setCurrentTerm } from "@/lib/services/academics";

/** PUT /api/terms/:id/current — make this the current term. */
export const PUT = route(async ({ user, params }) => {
  await setCurrentTerm(user, idParam(params));
});
