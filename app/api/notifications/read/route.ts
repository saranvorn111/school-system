import * as z from "zod";
import { readBody, route } from "@/lib/api/handler";
import { markNotificationsRead } from "@/lib/services/notifications";

const body = z.object({ id: z.number().int().positive().optional() });

/** POST /api/notifications/read — { id } marks one as read; {} marks all. */
export const POST = route(async ({ req, user }) => {
  await markNotificationsRead(user, (await readBody(req, body)).id);
});
