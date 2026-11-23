/** Workshops run on Saturday and Sunday at 9:00 Vietnam time (UTC+7, no daylight saving). */
const START_UTC_HOUR = 2; // 9:00 in Vietnam
const SATURDAY = 6;
const SUNDAY = 0;
export const WORKSHOP_CAPACITY = 30;

/** The next Saturday and the next Sunday at 9:00 Vietnam time strictly after `now`, earliest first. */
export function nextWeekendMornings(now: Date): Date[] {
  const found = new Map<number, Date>();
  const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), START_UTC_HOUR));
  for (let i = 0; i < 14 && found.size < 2; i++) {
    const candidate = new Date(day.getTime() + i * 86_400_000);
    // At 02:00 UTC the UTC date is the Vietnamese date, so getUTCDay() is the Vietnamese weekday.
    const weekday = candidate.getUTCDay();
    if ((weekday === SATURDAY || weekday === SUNDAY) && candidate > now && !found.has(weekday)) found.set(weekday, candidate);
  }
  return [...found.values()].sort((a, b) => a.getTime() - b.getTime());
}
