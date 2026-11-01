/**
 * Money — sf-051
 *
 * The storefront reads prices from two places that disagree on type: catalog
 * sends numbers, order rows send decimal strings (`numeric(12,2)` survives
 * Postgres as a string so precision is not lost in a float). One helper
 * normalises both, so a component never does arithmetic on `"12.00"` and a
 * confirmation page never prints `$NaN`.
 *
 * Rounding happens at parse time, to cents. Sums are therefore already exact
 * at display precision — no accumulated drift when a cart holds 30 lines.
 */

const USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Parse a number or decimal string into cents-rounded dollars.
 * Anything unparseable (null, "", "abc") is 0 — a missing price must render as
 * a number, not as `NaN`, because `NaN` propagates silently through totals.
 */
export function toMoney(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? round2(value) : 0;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? round2(parsed) : 0;
  }
  return 0;
}

/** `"12.5"` → `"$12.50"`. Grouped above a thousand, always two decimals. */
export function formatMoney(value: unknown): string {
  return USD.format(toMoney(value));
}
