import { idParam, readBody, route } from "@/lib/api/handler";
import { deleteTerm, updateTerm } from "@/lib/services/academics";
import { termSchema } from "@/lib/validation/academics";

/** PATCH /api/terms/:id — edit. */
export const PATCH = route(async ({ req, user, params }) => {
  await updateTerm(user, idParam(params), await readBody(req, termSchema));
});

/** DELETE /api/terms/:id — refused with 409 while other records still use it. */
export const DELETE = route(async ({ user, params }) => {
  await deleteTerm(user, idParam(params));
});
