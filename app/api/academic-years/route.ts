import { created, readBody, route } from "@/lib/api/handler";
import { createAcademicYear, getAcademicYears } from "@/lib/services/academics";
import { academicYearSchema } from "@/lib/validation/academics";

export const GET = route(async ({ user }) => getAcademicYears(user));
export const POST = route(async ({ req, user }) => created(await createAcademicYear(user, await readBody(req, academicYearSchema))));
