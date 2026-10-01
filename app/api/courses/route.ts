import { created, readBody, route } from "@/lib/api/handler";
import { createCourse, getCourses } from "@/lib/services/academics";
import { courseSchema } from "@/lib/validation/academics";

export const GET = route(async ({ user }) => getCourses(user));
export const POST = route(async ({ req, user }) => created(await createCourse(user, await readBody(req, courseSchema))));
