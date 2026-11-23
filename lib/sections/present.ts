/**
 * CMS date formatting — sf-060
 *
 * Testimonials and blog cards show a month and a year, never a raw ISO string:
 * `2026-11-04T00:00:00.000Z` is a database value, and putting it in front of a
 * shopper would be leaking the plumbing. Fixed locale, fixed parts, because a
 * date that changes shape with the server's locale is a layout bug waiting for
 * the next deploy.
 *
 * An unparseable date renders nothing rather than "Invalid Date" — the same
 * rule every other optional field in these blocks follows.
 */
const MONTH_YEAR = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" });

export function formatMonthYear(value: string | undefined | null): string | undefined {
  if (value === undefined || value === null || value.trim() === "") return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return MONTH_YEAR.format(parsed);
}

export const STAR_COUNT = 5;

export function starCells(rating: number | undefined): boolean[] | undefined {
  if (typeof rating !== "number" || !Number.isFinite(rating)) return undefined;
  const whole = Math.round(rating);
  if (whole < 1 || whole > STAR_COUNT) return undefined;
  return Array.from({ length: STAR_COUNT }, (_, i) => i < whole);
}
