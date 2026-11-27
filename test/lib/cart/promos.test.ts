import { describe, expect, it } from "vitest";
import { QUICK_PROMOS, resolveQuickPromos } from "@/lib/cart/promos";

describe("quick promos resolver (sf-093)", () => {
  it("offers the three prototype codes with none active by default", () => {
    expect(resolveQuickPromos(undefined).map((promo) => promo.code)).toEqual([...QUICK_PROMOS]);
    expect(resolveQuickPromos(undefined).every((promo) => !promo.active)).toBe(true);
  });

  it("matches an applied code case-insensitively without trusting it", () => {
    const promos = resolveQuickPromos(" welcome15 ");
    expect(promos.find((promo) => promo.code === "WELCOME15")?.active).toBe(true);
    expect(promos.filter((promo) => promo.active)).toHaveLength(1);
  });
});
