const dateTime = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Phnom_Penh",
});
const dateOnly = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" });

/** Accepts a Date or the ISO string it becomes after a trip through JSON. */
export const formatDateTime = (d: Date | string | null | undefined) => (d ? dateTime.format(new Date(d)) : "—");

/** For MySQL DATE columns, which come back as "YYYY-MM-DD" strings. */
export const formatDate = (d: string | null | undefined) => (d ? dateOnly.format(new Date(`${d}T00:00:00Z`)) : "—");

export const DAYS = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
export const DAY_OPTIONS = DAYS.slice(1).map((label, i) => ({ value: i + 1, label }));

export function formatSchedule(s: { dayOfWeek: number; startTime: string; endTime: string }) {
  return `${DAYS[s.dayOfWeek]?.slice(0, 3)} ${s.startTime}–${s.endTime}`;
}

/** Today in the school's timezone, as "YYYY-MM-DD" and ISO weekday (1 = Monday). */
export function schoolToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Phnom_Penh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  const weekday = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(get("weekday")) + 1;
  return { date: `${get("year")}-${get("month")}-${get("day")}`, weekday };
}
