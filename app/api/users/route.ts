import { created, readBody, readQuery, route } from "@/lib/api/handler";
import { createUser, listUsers } from "@/lib/services/users";
import { createUserSchema, userListQuery } from "@/lib/validation/users";

/** GET /api/users?q=&role=&page= — search accounts. */
export const GET = route(async ({ req, user }) => listUsers(user, readQuery(req, userListQuery)));

/** POST /api/users — create an admin, teacher or student with a temporary password. */
export const POST = route(async ({ req, user }) => created(await createUser(user, await readBody(req, createUserSchema))));
