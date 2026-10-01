import * as z from "zod";
import { readQuery, route } from "@/lib/api/handler";
import { auditLog } from "@/lib/services/dashboards";

const query = z.object({
  action: z.string().trim().optional(),
  entity: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).catch(1),
});

/** GET /api/audit-logs?action=&entity=&page= */
export const GET = route(async ({ req, user }) => auditLog(user, readQuery(req, query)));
