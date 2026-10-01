import { created, readBody, readQuery, route } from "@/lib/api/handler";
import { createSection, getSections } from "@/lib/services/sections";
import { sectionListQuery, sectionSchema } from "@/lib/validation/sections";

/** GET /api/sections?termId= — all sections (admin) or my classes (teacher). Defaults to the current term. */
export const GET = route(async ({ req, user }) => getSections(user, readQuery(req, sectionListQuery).termId));

export const POST = route(async ({ req, user }) => created(await createSection(user, await readBody(req, sectionSchema))));
