import { idParam, route } from "@/lib/api/handler";
import { dropEnrollment } from "@/lib/services/sections";

/** DELETE /api/enrollments/:id — drop a student from a section. */
export const DELETE = route(async ({ user, params }) => {
  await dropEnrollment(user, idParam(params));
});
