import { route } from "@/lib/api/handler";
import { getPendingGradeSections } from "@/lib/services/sections";

/** GET /api/grades/pending — sections waiting for approval or publishing. */
export const GET = route(async ({ user }) => getPendingGradeSections(user));
