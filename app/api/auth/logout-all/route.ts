import { route } from "@/lib/api/handler";
import { logoutAllDevices } from "@/lib/services/auth";

/** POST /api/auth/logout-all — ends every session of the current user. */
export const POST = route(async ({ user }) => {
  await logoutAllDevices(user);
});
