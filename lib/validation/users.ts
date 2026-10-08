import * as z from "zod";
import { genders } from "@/lib/constants";
import { optionalId, optionalText } from "./common";

const base = {
  fullName: z.string().trim().min(2, "Enter the full name.").max(150),
  email: z.email("Enter a valid email.").transform((e) => e.toLowerCase()),
};
// Optional: when left empty the server generates the next ID (see lib/login-id.ts).
const loginId = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.string().trim().regex(/^[A-Za-z0-9-]{2,32}$/, "Letters, numbers and dashes only.").optional(),
);

export const createUserSchema = z.discriminatedUnion("role", [
  z.object({
    role: z.literal("ADMIN"),
    ...base,
    username: z.string().trim().regex(/^[A-Za-z0-9._-]{3,64}$/, "3–64 letters, numbers, dot, dash or underscore."),
  }),
  z.object({
    role: z.literal("TEACHER"),
    ...base,
    employeeId: loginId,
    departmentId: optionalId,
    title: optionalText(64),
    phone: optionalText(32),
  }),
  z.object({
    role: z.literal("STUDENT"),
    ...base,
    studentCode: loginId,
    programId: optionalId,
    admissionYear: z.coerce.number().int().min(1990, "Enter a valid year.").max(2100, "Enter a valid year."),
    gender: z.preprocess((v) => (v === "" ? undefined : v), z.enum(genders).optional()),
    dateOfBirth: z.preprocess((v) => (v === "" ? undefined : v), z.iso.date("Use a valid date.").optional()),
    phone: optionalText(32),
  }),
]);
export type CreateUserInput = z.input<typeof createUserSchema>;

export const updateUserSchema = z.object(base);

export const userStatusSchema = z.object({ status: z.enum(["active", "disabled"]) });

export const userListQuery = z.object({
  q: z.string().trim().optional(),
  role: z.enum(["ADMIN", "TEACHER", "STUDENT"]).optional().catch(undefined),
  page: z.coerce.number().int().min(1).catch(1),
});
