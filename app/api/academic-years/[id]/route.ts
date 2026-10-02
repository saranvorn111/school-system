import { idParam, readBody, route } from "@/lib/api/handler";
import { deleteAcademicYear, updateAcademicYear } from "@/lib/services/academics";
import { academicYearSchema } from "@/lib/validation/academics";

/** PATCH /api/academic-years/:id — edit. */
export const PATCH = route(async ({ req, user, params }) => {
  await updateAcademicYear(user, idParam(params), await readBody(req, academicYearSchema));
});

/** DELETE /api/academic-years/:id — refused with 409 while other records still use it. */
export const DELETE = route(async ({ user, params }) => {
  await deleteAcademicYear(user, idParam(params));
});
