/**
 * Quantity arithmetic — sf-051
 * (commerce.md §3: the clamp lives here; the block only renders it)
 *
 * Two surfaces sell by the unit — the PDP purchase panel and every cart line —
 * and both need the same three rules. Getting any of them wrong is a money
 * bug, so they are one pure function instead of a `Math.max` at each call site:
 *
 * - **No fractions.** `2.5` units is not an order cart-svc will accept.
 * - **No zero.** Zero is how a shopper *means* "remove", but the stepper's
 *   clamp cannot know that; it floors at 1 and removal stays its own action.
 * - **No ceiling the service will reject.** `max` comes from stock on the PDP
 *   and defaults to the house ceiling, so a typed `500` lands on something
 *   cart-svc will answer rather than 400.
 */

/** House floor/ceiling when the caller names neither (per-line stock overrides). */
export const QTY_LIMITS = { min: 1, max: 99 } as const;

export interface QtyBounds {
  min?: number;
  max?: number;
}

/**
 * Clamp to a whole number inside `[min, max]`.
 *
 * A max below min is not a range, so min wins: an out-of-stock product (stock
 * 0) must not produce a stepper that can render 0 — the caller hides it
 * instead, and if it slips through, the floor is still legal.
 */
export function clampQty(value: number, bounds: QtyBounds = {}): number {
  const min = bounds.min ?? QTY_LIMITS.min;
  const max = Math.max(min, bounds.max ?? QTY_LIMITS.max);
  // NaN is a parse failure, not a number ("", "abc" typed into the field); it
  // takes the floor so the caller can never push NaN upstream. ±Infinity is a
  // number that clamps like any other.
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}
