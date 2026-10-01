import * as z from "zod";

// Form inputs send "" for untouched optional fields; treat that as "not given".
const blankToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

export const optionalText = (max: number) => z.preprocess(blankToUndefined, z.string().trim().max(max).optional());

export const id = (message = "Choose an option.") => z.coerce.number({ error: message }).int().positive(message);

export const optionalId = z.preprocess(blankToUndefined, z.coerce.number().int().positive().optional());

export const isoDate = (message = "Pick a date.") => z.iso.date(message);

export const code = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9-]{2,20}$/, "2–20 letters, numbers or dashes.")
  .transform((c) => c.toUpperCase());

export const name = z.string().trim().min(2, "Enter a name.").max(150);
