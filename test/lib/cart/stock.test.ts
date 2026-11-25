import { describe, expect, it } from "vitest";
import { capToStock, stockCeiling } from "@/lib/cart/stock";

describe("per-line stock ceiling (sf-058)", () => {
  it("uses the house ceiling when stock is absent or malformed", () => {
    expect(stockCeiling(undefined)).toBe(99);
    expect(stockCeiling(null)).toBe(99);
    expect(stockCeiling(Number.NaN)).toBe(99);
  });

  it("floors at one and caps at the house ceiling", () => {
    expect(stockCeiling(0)).toBe(1);
    expect(stockCeiling(4.8)).toBe(4);
    expect(stockCeiling(500)).toBe(99);
  });

  it("caps a typed quantity without raising it", () => {
    expect(capToStock(10, 3)).toBe(3);
    expect(capToStock(2, 7)).toBe(2);
  });
});
