import { idParam, readBody, route } from "@/lib/api/handler";
import { assignTeacher } from "@/lib/services/sections";
import { assignTeacherSchema } from "@/lib/validation/sections";

/** PUT /api/sections/:id/teacher — { teacherId } (null to unassign). */
export const PUT = route(async ({ req, user, params }) => {
  const { teacherId } = await readBody(req, assignTeacherSchema);
  await assignTeacher(user, idParam(params), teacherId);
});
