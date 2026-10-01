import { created, idParam, readBody, route } from "@/lib/api/handler";
import { enrollStudent, getAvailableStudents } from "@/lib/services/sections";
import { enrollSchema } from "@/lib/validation/sections";

/** GET /api/sections/:id/enrollments — students that can still be enrolled. */
export const GET = route(async ({ user, params }) => getAvailableStudents(user, idParam(params)));

/** POST /api/sections/:id/enrollments — { studentId } */
export const POST = route(async ({ req, user, params }) => {
  const { studentId } = await readBody(req, enrollSchema);
  return created(await enrollStudent(user, idParam(params), studentId));
});
