import { idParam, readBody, route } from "@/lib/api/handler";
import { deleteCourse, updateCourse } from "@/lib/services/academics";
import { courseSchema } from "@/lib/validation/academics";

/** PATCH /api/courses/:id — edit. */
export const PATCH = route(async ({ req, user, params }) => {
  await updateCourse(user, idParam(params), await readBody(req, courseSchema));
});

/** DELETE /api/courses/:id — refused with 409 while other records still use it. */
export const DELETE = route(async ({ user, params }) => {
  await deleteCourse(user, idParam(params));
});
