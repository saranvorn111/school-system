import { publicRoute, readBody } from "@/lib/api/handler";
import { login } from "@/lib/services/auth";
import { loginSchema } from "@/lib/validation/auth";

/** POST /api/auth/login — sets the session cookie and says where to go next. */
export const POST = publicRoute(async ({ req }) => login(await readBody(req, loginSchema)));
