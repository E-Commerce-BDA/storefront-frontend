/**
 * The quantity clamp — one function behind every unit the shopper picks.
 *
 * The cases that matter are the illegal ones: a fraction, a zero, a typed 500,
 * and the degenerate range the PDP can produce when stock is 0.
 */
import { describe, expect, it } from "vitest";
import { QTY_LIMITS, clampQty } from "@/lib/commerce/quantity";

describe("clampQty", () => {
  it("passes a legal quantity through untouched", () => {
    expect(clampQty(3, { min: 1, max: 10 })).toBe(3);
  });

  it("floors at min when the value is below it", () => {
    expect(clampQty(0, { min: 1, max: 10 })).toBe(1);
    expect(clampQty(-4, { min: 1, max: 10 })).toBe(1);
  });

  it("ceils at max when the value is above it", () => {
    expect(clampQty(500, { min: 1, max: 10 })).toBe(10);
  });

  it("truncates a fraction instead of sending it upstream", () => {
    expect(clampQty(2.9, { min: 1, max: 10 })).toBe(2);
  });

  it("falls back to the house floor and ceiling when no bounds are given", () => {
    expect(clampQty(0)).toBe(QTY_LIMITS.min);
    expect(clampQty(QTY_LIMITS.max + 1)).toBe(QTY_LIMITS.max);
  });

  it("honours a custom floor above the house one", () => {
    expect(clampQty(1, { min: 3 })).toBe(3);
  });

  it("treats a max below min as no range — min wins", () => {
    // Stock 0 must never render a stepper showing 0: the caller hides the
    // block, and if it slips through the floor is still a legal quantity.
    expect(clampQty(0, { min: 1, max: 0 })).toBe(1);
  });

  it("answers NaN with min, never NaN", () => {
    // A NaN that reaches cart-svc fails validation; one that reaches a total
    // blanks the whole page. Infinity is a number and clamps like one.
    expect(clampQty(Number.NaN, { min: 2, max: 9 })).toBe(2);
    expect(clampQty(Number.POSITIVE_INFINITY, { min: 2, max: 9 })).toBe(9);
  });
});
