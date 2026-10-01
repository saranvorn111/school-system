import * as z from "zod";

export const passwordSchema = z
  .string()
  .min(8, "At least 8 characters.")
  .regex(/[a-zA-Z]/, "At least one letter.")
  .regex(/[0-9]/, "At least one number.");

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Enter your email, student ID or employee ID."),
  password: z.string().min(1, "Enter your password."),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    path: ["newPassword"],
    message: "Choose a password different from the current one.",
  });
