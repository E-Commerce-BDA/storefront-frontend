import { describe, expect, it } from "vitest";
import { parseGridMode, resolveShopToolbar } from "@/lib/shop/models";

describe("parseGridMode (sf-092)", () => {
  it("accepts only the two known faces and defaults junk to two columns", () => {
    expect(parseGridMode("one")).toBe("one");
    expect(parseGridMode("two")).toBe("two");
    expect(parseGridMode("ONE")).toBe("two");
    expect(parseGridMode(undefined)).toBe("two");
    expect(parseGridMode(42)).toBe("two");
  });

  it("keeps the flat-over-options precedence for the toolbar copy", () => {
    expect(resolveShopToolbar({ resultLabel: "items" }, { resultLabel: "products" }).resultLabel).toBe(
      "products",
    );
    expect(resolveShopToolbar(undefined).showCount).toBe(true);
  });
});
