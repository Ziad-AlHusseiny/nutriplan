// Weeks run Monday to Sunday (PRD §6.2). A week is keyed by its Monday's
// local date, "2026-10-05", so plans line up with the calendar.

export const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
export const SLOTS = ['breakfast', 'lunch', 'dinner', 'snacks'];

const pad = (n) => String(n).padStart(2, '0');
export const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function parseKey(key) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key ?? '');
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) || dateKey(d) !== key ? null : d;
}

/** The Monday of the week containing `date` (local time), at midnight. */
export function mondayOf(date = new Date()) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const offset = (d.getDay() + 6) % 7; // Monday 0 … Sunday 6
  d.setDate(d.getDate() - offset);
  return d;
}

export const weekKeyOf = (date = new Date()) => dateKey(mondayOf(date));

/** True for a key that is a real Monday. */
export const isWeekKey = (key) => {
  const d = parseKey(key);
  return Boolean(d) && d.getDay() === 1;
};

export function addWeeks(key, n) {
  const d = parseKey(key);
  d.setDate(d.getDate() + n * 7);
  return dateKey(d);
}

/** The seven dates of a week. */
export function weekDates(key) {
  const start = parseKey(key);
  return DAYS.map((_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
}

/** Index of today's weekday (0 = Monday), or -1 when `key` isn't this week. */
export function todayIndex(key, now = new Date()) {
  if (weekKeyOf(now) !== key) return -1;
  return (now.getDay() + 6) % 7;
}
