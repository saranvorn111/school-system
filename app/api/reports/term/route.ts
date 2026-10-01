import { readQuery, route } from "@/lib/api/handler";
import { termReport } from "@/lib/services/reports";
import { sectionListQuery } from "@/lib/validation/sections";

/** GET /api/reports/term?termId= — enrollment, attendance and grade results per section. */
export const GET = route(async ({ req, user }) => termReport(user, readQuery(req, sectionListQuery).termId));
