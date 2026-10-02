import { idParam, readBody, route } from "@/lib/api/handler";
import { deleteProgram, updateProgram } from "@/lib/services/academics";
import { programSchema } from "@/lib/validation/academics";

/** PATCH /api/programs/:id — edit. */
export const PATCH = route(async ({ req, user, params }) => {
  await updateProgram(user, idParam(params), await readBody(req, programSchema));
});

/** DELETE /api/programs/:id — refused with 409 while other records still use it. */
export const DELETE = route(async ({ user, params }) => {
  await deleteProgram(user, idParam(params));
});
