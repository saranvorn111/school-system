import * as z from "zod";
import { degreeLevels } from "@/lib/constants";
import { code, id, isoDate, name, optionalId, optionalText } from "./common";

export const departmentSchema = z.object({ code, name });

export const programSchema = z.object({
  code,
  name,
  departmentId: id("Choose a department."),
  degreeLevel: z.enum(degreeLevels),
});

const endAfterStart = (d: { startDate: string; endDate: string }) => d.startDate < d.endDate;
const endAfterStartError = { path: ["endDate"], message: "End date must be after the start date." };

export const academicYearSchema = z
  .object({
    name: z.string().trim().regex(/^\d{4}-\d{4}$/, "Use the format 2026-2027."),
    startDate: isoDate("Pick a start date."),
    endDate: isoDate("Pick an end date."),
  })
  .refine(endAfterStart, endAfterStartError);

export const termSchema = z
  .object({
    academicYearId: id("Choose an academic year."),
    name: z.string().trim().min(2, "Enter a name.").max(64),
    startDate: isoDate("Pick a start date."),
    endDate: isoDate("Pick an end date."),
  })
  .refine(endAfterStart, endAfterStartError);

export const courseSchema = z.object({
  code,
  title: name,
  credits: z.coerce.number().int().min(0, "0–12").max(12, "0–12"),
  departmentId: optionalId,
  description: optionalText(2000),
});
