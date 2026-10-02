import { idParam, readBody, route } from "@/lib/api/handler";
import { deleteDepartment, updateDepartment } from "@/lib/services/academics";
import { departmentSchema } from "@/lib/validation/academics";

/** PATCH /api/departments/:id — edit. */
export const PATCH = route(async ({ req, user, params }) => {
  await updateDepartment(user, idParam(params), await readBody(req, departmentSchema));
});

/** DELETE /api/departments/:id — refused with 409 while other records still use it. */
export const DELETE = route(async ({ user, params }) => {
  await deleteDepartment(user, idParam(params));
});
