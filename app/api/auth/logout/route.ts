import { publicRoute } from "@/lib/api/handler";
import { getCurrentUser } from "@/lib/auth/current-user";
import { logout } from "@/lib/services/auth";

/** POST /api/auth/logout — ends the current session. */
export const POST = publicRoute(async () => {
  await logout(await getCurrentUser());
});
