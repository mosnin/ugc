/**
 * Posting-slot math. A channel posts at fixed local times ("HH:MM") every day
 * in its IANA timezone. These helpers turn that into absolute timestamps.
 * Pure functions, no Convex imports, so they are easy to unit test.
 */

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidPostTime(t: string): boolean {
  return TIME_RE.test(t);
}

export function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Offset of `timeZone` from UTC at instant `at`, in minutes (UTC+2 -> 120). */
function tzOffsetMinutes(at: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(at));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return Math.round((asUtc - Math.floor(at / 1000) * 1000) / 60000);
}

/** Local calendar date (y, m, d) of instant `at` in `timeZone`. */
function localDate(at: number, timeZone: string): { y: number; m: number; d: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(at));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { y: get("year"), m: get("month"), d: get("day") };
}

/** Absolute timestamp of local wall time y-m-d hh:mm in `timeZone`. */
export function zonedTimeToUtc(
  y: number,
  m: number,
  d: number,
  hh: number,
  mm: number,
  timeZone: string,
): number {
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  // Two passes handle the offset changing between the guess and the answer
  // (DST transitions).
  let result = guess - tzOffsetMinutes(guess, timeZone) * 60000;
  result = guess - tzOffsetMinutes(result, timeZone) * 60000;
  return result;
}

/**
 * Every slot in [from, to) for a channel posting at `postTimes` local times in
 * `timeZone`, sorted ascending.
 */
export function upcomingSlots(
  postTimes: string[],
  timeZone: string,
  from: number,
  to: number,
): number[] {
  const times = postTimes.filter(isValidPostTime).map((t) => t.split(":").map(Number));
  if (times.length === 0 || to <= from) return [];
  const slots = new Set<number>();
  // Walk local days from the day before `from` to the day after `to` so slots
  // near midnight in any offset are covered.
  for (let day = from - 86_400_000; day <= to + 86_400_000; day += 86_400_000) {
    const { y, m, d } = localDate(day, timeZone);
    for (const [hh, mm] of times) {
      const at = zonedTimeToUtc(y, m, d, hh, mm, timeZone);
      if (at >= from && at < to) slots.add(at);
    }
  }
  return [...slots].sort((a, b) => a - b);
}
