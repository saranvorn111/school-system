import { created, readBody, route } from "@/lib/api/handler";
import { createDepartment, getDepartments } from "@/lib/services/academics";
import { departmentSchema } from "@/lib/validation/academics";

export const GET = route(async ({ user }) => getDepartments(user));
export const POST = route(async ({ req, user }) => created(await createDepartment(user, await readBody(req, departmentSchema))));
