/**
 * Timetable slots are one-off, one-hour sessions on a specific calendar date.
 * Dates travel through the app as "YYYY-MM-DD" strings and are stored in
 * Postgres DATE columns (UTC midnight when held as a JS Date), so a slot's
 * calendar day never shifts with the server's or viewer's timezone. The start
 * hour is plain wall-clock time (8 = 08:00).
 */

export const FIRST_SLOT_HOUR = 8;
export const LAST_SLOT_HOUR = 16; // last slot is 16:00-17:00
export const SLOT_START_HOURS = Array.from(
  { length: LAST_SLOT_HOUR - FIRST_SLOT_HOUR + 1 },
  (_, index) => FIRST_SLOT_HOUR + index,
);

/** Placeholder section given to classrooms that pre-date the mandatory-section rule. */
export const UNASSIGNED_SECTION = "Unassigned";

/** Case/whitespace-insensitive section identity, so "3A", "3a" and " 3A " are one section. */
export function toSectionKey(section: string): string {
  return section.trim().replace(/\s+/g, " ").toLowerCase();
}

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** "YYYY-MM-DD" -> Date at UTC midnight, or null if malformed / not a real calendar date. */
export function parseDateOnly(value: string): Date | null {
  if (!DATE_ONLY_PATTERN.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    return null;
  }

  return date;
}

export function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Today's calendar date in the server's local timezone, as "YYYY-MM-DD". */
export function todayDateOnly(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/** Classes run Monday-Saturday. */
export function isSunday(date: Date): boolean {
  return date.getUTCDay() === 0;
}

export function isValidSlotHour(hour: number): boolean {
  return Number.isInteger(hour) && hour >= FIRST_SLOT_HOUR && hour <= LAST_SLOT_HOUR;
}

/** The wall-clock moment a slot starts, in the server's local timezone. */
export function slotStartsAt(date: Date, hour: number): Date {
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), hour, 0, 0, 0);
}

export function isSlotInPast(date: Date, hour: number, now: Date = new Date()): boolean {
  return slotStartsAt(date, hour).getTime() <= now.getTime();
}

function formatHour(hour: number): string {
  const suffix = hour >= 12 ? "PM" : "AM";
  const twelveHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${twelveHour}:00 ${suffix}`;
}

/** e.g. "10:00 AM - 11:00 AM" */
export function formatHourRange(startHour: number): string {
  return `${formatHour(startHour)} - ${formatHour(startHour + 1)}`;
}

/** e.g. "Mon, Oct 14, 2026" - formatted in UTC so the stored calendar day is shown as-is. */
export function formatSlotDate(date: Date | string): string {
  const value = typeof date === "string" ? new Date(`${date}T00:00:00.000Z`) : date;
  return value.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** e.g. "Mon, Oct 14, 2026, 10:00 AM - 11:00 AM" */
export function formatSlot(date: Date | string, startHour: number): string {
  return `${formatSlotDate(date)}, ${formatHourRange(startHour)}`;
}
