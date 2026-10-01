import { created, readBody, route } from "@/lib/api/handler";
import { createProgram, getPrograms } from "@/lib/services/academics";
import { programSchema } from "@/lib/validation/academics";

export const GET = route(async ({ user }) => getPrograms(user));
export const POST = route(async ({ req, user }) => created(await createProgram(user, await readBody(req, programSchema))));
