import { describe, expect, it } from "vitest";
import { discountAmount, totalAfterDiscount } from "@/lib/order/discount";

describe("coupon preview arithmetic (sf-057)", () => {
  it("ignores invalid or absent results", () => {
    expect(discountAmount(null, 100)).toBe(0);
    expect(discountAmount({ valid: false, value: 10 }, 100)).toBe(0);
  });

  it("uses an explicit server discount when present", () => {
    expect(discountAmount({ valid: true, code: "X", discount: 12.345 }, 100)).toBe(12.35);
  });

  it("computes percent and fixed discounts identically for cart and checkout", () => {
    expect(discountAmount({ valid: true, discountType: "percent", value: 10 }, 20)).toBe(2);
    expect(discountAmount({ valid: true, discountType: "fixed", value: 5 }, 20)).toBe(5);
  });

  it("never previews a negative total, even for an oversized code", () => {
    const discount = discountAmount({ valid: true, discountType: "fixed", value: 500 }, 20);
    expect(discount).toBe(20);
    expect(totalAfterDiscount(20, discount)).toBe(0);
    expect(totalAfterDiscount(20, 3)).toBe(17);
  });
});
