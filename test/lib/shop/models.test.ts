import { describe, expect, it } from "vitest";
import {
  DEFAULT_FILTER_DRAWER,
  DEFAULT_SEGMENTED_TOGGLE,
  resolveFilterDrawer,
  resolveMenu,
  resolveSegmentedToggle,
  resolveShopToolbar,
} from "@/lib/shop/models";

const options = [
  { value: "a", label: "A" },
  { value: "b", label: "B" },
  { value: "c", label: "C" },
];

describe("shop chrome resolvers", () => {
  it("resolves segmented defaults and caps the option list", () => {
    const fallback = resolveSegmentedToggle(undefined);
    expect(fallback.options).toEqual([]);
    expect(fallback.size).toBe("md");
    expect(fallback.ariaLabel).toBe("Choose a view");
    const capped = resolveSegmentedToggle({ options, maxOptions: 99 });
    expect(capped.options).toHaveLength(3);
    expect(resolveSegmentedToggle({ options, maxOptions: 0 }).options).toHaveLength(1);
    // Flat props beat the object, which beats the resolver default.
    const flat = resolveSegmentedToggle(
      { options, size: "sm", ariaLabel: "object" },
      { size: "md", ariaLabel: "flat" },
    );
    expect(flat.size).toBe("md");
    expect(flat.ariaLabel).toBe("flat");
    expect(DEFAULT_SEGMENTED_TOGGLE.size).toBe("md");
  });

  it("resolves menu alignment and aria label with flat precedence", () => {
    expect(resolveMenu(undefined)).toEqual({ align: "start", ariaLabel: "Menu" });
    expect(resolveMenu({ align: "end" }, { align: "start" }).align).toBe("start");
    expect(resolveMenu({ ariaLabel: "object" }, { ariaLabel: "flat" }).ariaLabel).toBe("flat");
  });

  it("clamps drawer width and resolves side/title", () => {
    expect(resolveFilterDrawer(undefined)).toEqual({ side: "left", title: "Filters", width: 320 });
    expect(resolveFilterDrawer({ width: 10 }).width).toBe(240);
    expect(resolveFilterDrawer({ width: 9999 }, { width: 400 }).width).toBe(400);
    expect(resolveFilterDrawer({ side: "right" }, { side: "left" }).side).toBe("left");
    expect(DEFAULT_FILTER_DRAWER.title).toBe("Filters");
  });

  it("resolves toolbar copy and count visibility", () => {
    expect(resolveShopToolbar(undefined)).toEqual({ resultLabel: "results", showCount: true });
    expect(resolveShopToolbar({ showCount: false }).showCount).toBe(false);
    expect(
      resolveShopToolbar({ resultLabel: "object" }, { resultLabel: "flat" }).resultLabel,
    ).toBe("flat");
  });
});
