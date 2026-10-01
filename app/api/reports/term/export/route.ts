import * as z from "zod";
import { readQuery, route } from "@/lib/api/handler";
import { audit } from "@/lib/audit";
import { termReportCsv } from "@/lib/services/reports";

const query = z.object({
  kind: z.enum(["sections", "at-risk"]).catch("sections"),
  termId: z.coerce.number().int().positive().optional().catch(undefined),
});

/** GET /api/reports/term/export?kind=sections|at-risk&termId= — downloads a CSV file. */
export const GET = route(async ({ req, user }) => {
  const { kind, termId } = readQuery(req, query);
  const csv = await termReportCsv(user, kind, termId);
  await audit({ actorUserId: user.id, action: "report.exported", entityType: "report", entityId: kind, after: { termId: termId ?? "current" } });
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${kind}-report.csv"`,
    },
  });
});
