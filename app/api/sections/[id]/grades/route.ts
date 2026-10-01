import { idParam, readBody, route } from "@/lib/api/handler";
import { getGradeSheet, saveGrades } from "@/lib/services/grades";
import { gradesSaveSchema } from "@/lib/validation/sections";

/** GET /api/sections/:id/grades — scores and workflow status. */
export const GET = route(async ({ user, params }) => getGradeSheet(user, idParam(params)));

/** PUT /api/sections/:id/grades — { scores: [{ enrollmentId, score | null }] } (draft only). */
export const PUT = route(async ({ req, user, params }) => saveGrades(user, idParam(params), await readBody(req, gradesSaveSchema)));
