export type Slot = { dayOfWeek: number; startTime: string; endTime: string };

export const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const minutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

export function isValidRange(start: string, end: string) {
  return TIME_PATTERN.test(start) && TIME_PATTERN.test(end) && minutes(start) < minutes(end);
}

/** Two weekly slots clash when they are on the same day and their times overlap. */
export function slotsOverlap(a: Slot, b: Slot) {
  return (
    a.dayOfWeek === b.dayOfWeek &&
    minutes(a.startTime) < minutes(b.endTime) &&
    minutes(b.startTime) < minutes(a.endTime)
  );
}
