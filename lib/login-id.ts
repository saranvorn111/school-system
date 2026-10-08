/**
 * Automatic login IDs: a letter, the year and a running number.
 *   students → S + admission year + number   e.g. S2026006
 *   teachers → T + year created   + number   e.g. T2026001
 * The number restarts every year and is at least 3 digits (it simply grows to 4 after 999).
 */
export const ID_PREFIX = { STUDENT: "S", TEACHER: "T" } as const;
export type AutoIdRole = keyof typeof ID_PREFIX;

const MIN_DIGITS = 3;

export function formatLoginId(role: AutoIdRole, year: number, sequence: number) {
  return `${ID_PREFIX[role]}${year}${String(sequence).padStart(MIN_DIGITS, "0")}`;
}

/** The running number of an ID in this role/year series, or null if it isn't one (e.g. "T0001", "st2"). */
export function sequenceOf(id: string, role: AutoIdRole, year: number): number | null {
  const match = new RegExp(`^${ID_PREFIX[role]}${year}(\\d{${MIN_DIGITS},})$`).exec(id);
  return match ? Number(match[1]) : null;
}

/** Next ID after the ones already taken. Old IDs in other formats are ignored. */
export function nextLoginId(role: AutoIdRole, year: number, existingIds: string[]) {
  const highest = existingIds.reduce((max, id) => Math.max(max, sequenceOf(id, role, year) ?? 0), 0);
  return formatLoginId(role, year, highest + 1);
}
