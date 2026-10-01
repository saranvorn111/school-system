/**
 * Grading scale (score 0–100 → letter and grade point).
 * Based on the common Cambodian higher-education scale; adjust to your institution.
 */
export const GRADE_SCALE = [
  { min: 85, letter: "A", point: 4.0 },
  { min: 80, letter: "B+", point: 3.5 },
  { min: 70, letter: "B", point: 3.0 },
  { min: 65, letter: "C+", point: 2.5 },
  { min: 50, letter: "C", point: 2.0 },
  { min: 45, letter: "D", point: 1.5 },
  { min: 40, letter: "E", point: 1.0 },
  { min: 0, letter: "F", point: 0.0 },
] as const;

export function scoreToGrade(score: number) {
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    throw new RangeError("Score must be between 0 and 100");
  }
  const row = GRADE_SCALE.find((g) => score >= g.min)!;
  return { letter: row.letter, point: row.point };
}

/** Credit-weighted GPA. Returns null when there are no credits yet. */
export function computeGpa(items: { credits: number; gradePoint: number }[]) {
  const credits = items.reduce((sum, i) => sum + i.credits, 0);
  if (credits === 0) return null;
  const points = items.reduce((sum, i) => sum + i.credits * i.gradePoint, 0);
  return Math.round((points / credits) * 100) / 100;
}
