import { describe, expect, it } from "vitest";
import { isShortLine, resolveShortfall } from "@/lib/checkout/shortfall";

const DETAILS = {
  itemIds: ["v1", "p2"],
  items: [
    { productId: "p1", variantId: "v1" },
    { productId: "p2", variantId: null },
  ],
};

describe("stock shortfall resolver (ord-013)", () => {
  it("parses the structured details and refuses malformed payloads", () => {
    expect(resolveShortfall(DETAILS)).toEqual(DETAILS);
    expect(resolveShortfall({ itemIds: "p1" })).toBeNull();
    expect(resolveShortfall(undefined)).toBeNull();
  });

  it("matches by both ids, including the variantless cart key", () => {
    const shortfall = resolveShortfall(DETAILS);
    if (shortfall === null) throw new Error("expected a parsed shortfall");
    expect(isShortLine(shortfall, { productId: "p1", variantId: "v1" })).toBe(true);
    expect(isShortLine(shortfall, { productId: "p2" })).toBe(true);
    expect(isShortLine(shortfall, { productId: "p3" })).toBe(false);
    expect(isShortLine(shortfall, { productId: "p1", variantId: "other" })).toBe(false);
  });
});
