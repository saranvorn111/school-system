import { idParam, route } from "@/lib/api/handler";
import { getSection } from "@/lib/services/sections";

/** GET /api/sections/:id — section details and roster. */
export const GET = route(async ({ user, params }) => getSection(user, idParam(params)));
