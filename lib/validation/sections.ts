import * as z from "zod";
import { attendanceStatuses } from "@/lib/constants";
import { isValidRange, TIME_PATTERN } from "@/lib/schedule";
import { id, isoDate, optionalId, optionalText } from "./common";

export const sectionSchema = z
  .object({
    courseId: id("Choose a course."),
    termId: id("Choose a term."),
    sectionCode: z
      .string()
      .trim()
      .regex(/^[A-Za-z0-9]{1,10}$/, "1–10 letters or numbers.")
      .transform((s) => s.toUpperCase()),
    teacherId: optionalId,
    room: optionalText(32),
    dayOfWeek: z.coerce.number().int().min(1, "Choose a day.").max(7),
    startTime: z.string().regex(TIME_PATTERN, "Use HH:MM."),
    endTime: z.string().regex(TIME_PATTERN, "Use HH:MM."),
    capacity: z.coerce.number().int().min(1, "At least 1.").max(1000),
  })
  .refine((d) => isValidRange(d.startTime, d.endTime), { path: ["endTime"], message: "End time must be after start time." });

export const sectionListQuery = z.object({ termId: z.coerce.number().int().positive().optional().catch(undefined) });

export const assignTeacherSchema = z.object({ teacherId: z.coerce.number().int().positive().nullable() });

export const enrollSchema = z.object({ studentId: id("Choose a student.") });

export const attendanceQuery = z.object({ date: isoDate().optional().catch(undefined) });

export const attendanceSaveSchema = z.object({
  date: isoDate(),
  records: z
    .array(
      z.object({
        studentId: z.number().int().positive(),
        status: z.enum(attendanceStatuses, "Mark every student."),
        note: z.string().trim().max(255).nullish(),
      }),
    )
    .min(1, "No students to mark."),
});

export const gradesSaveSchema = z.object({
  scores: z.array(
    z.object({
      enrollmentId: z.number().int().positive(),
      score: z.number().min(0, "0–100").max(100, "0–100").nullable(),
    }),
  ),
});

export const gradeReviewSchema = z.object({ note: z.string().trim().max(255).optional() });
