import { route } from "@/lib/api/handler";
import { listMyNotifications } from "@/lib/services/notifications";

/** GET /api/notifications — my latest notifications and the unread count. */
export const GET = route(async ({ user }) => listMyNotifications(user));
