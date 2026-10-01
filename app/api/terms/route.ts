import { created, readBody, route } from "@/lib/api/handler";
import { createTerm, getTerms } from "@/lib/services/academics";
import { termSchema } from "@/lib/validation/academics";

export const GET = route(async () => getTerms());
export const POST = route(async ({ req, user }) => created(await createTerm(user, await readBody(req, termSchema))));
