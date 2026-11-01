/**
 * Money — the bridge between catalog numbers and order-row decimal strings.
 * A `$NaN` on a confirmation page is the failure this file exists to prevent,
 * so "unparseable becomes 0" is asserted explicitly.
 */
import { describe, expect, it } from "vitest";
import { formatMoney, toMoney } from "@/lib/commerce/money";

describe("toMoney", () => {
  it("keeps numbers as numbers", () => {
    expect(toMoney(12.5)).toBe(12.5);
    expect(toMoney(0)).toBe(0);
  });

  it("parses the decimal strings Postgres sends", () => {
    expect(toMoney("129.90")).toBe(129.9);
    expect(toMoney("0.05")).toBe(0.05);
    expect(toMoney("1000")).toBe(1000);
  });

  it("rounds to cents so sums stay exact", () => {
    expect(toMoney(12.345)).toBe(12.35);
    expect(toMoney("12.344")).toBe(12.34);
  });

  it("turns anything unparseable into 0 instead of NaN", () => {
    expect(toMoney(null)).toBe(0);
    expect(toMoney(undefined)).toBe(0);
    expect(toMoney("")).toBe(0);
    expect(toMoney("abc")).toBe(0);
    expect(toMoney(Number.NaN)).toBe(0);
    expect(toMoney(Number.POSITIVE_INFINITY)).toBe(0);
    expect(Number.isNaN(toMoney("abc"))).toBe(false);
  });
});

describe("formatMoney", () => {
  it("always shows two decimals", () => {
    expect(formatMoney(12)).toBe("$12.00");
    expect(formatMoney("12.5")).toBe("$12.50");
  });

  it("groups thousands", () => {
    expect(formatMoney("1234.5")).toBe("$1,234.50");
  });

  it("renders a missing price as zero, not as NaN", () => {
    expect(formatMoney(undefined)).toBe("$0.00");
  });
});
