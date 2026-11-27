import { describe, expect, it } from "vitest";
import { initialOverlayMachine, overlayMachine } from "@/lib/overlay/machine";

describe("quick-view selection machine", () => {
  it("resets variant, qty and image when a new product opens", () => {
    const dirty = overlayMachine(
      overlayMachine(
        overlayMachine(initialOverlayMachine(), { type: "selection/set", name: "Size", value: "L" }),
        { type: "qty/set", qty: 5, min: 1, max: 9 },
      ),
      { type: "image/set", index: 2, count: 3 },
    );
    expect(dirty.selectedOptions.Size).toBe("L");
    const reopened = overlayMachine(dirty, { type: "open" });
    expect(reopened.selectedOptions).toEqual({});
    expect(reopened.qty).toBe(1);
    expect(reopened.imageIndex).toBe(0);
  });

  it("clamps qty and wraps gallery index", () => {
    const high = overlayMachine(initialOverlayMachine(), { type: "qty/set", qty: 999, min: 1, max: 9 });
    expect(high.qty).toBe(9);
    const low = overlayMachine(high, { type: "qty/set", qty: -4, min: 1, max: 9 });
    expect(low.qty).toBe(1);
    expect(overlayMachine(low, { type: "image/set", index: -1, count: 3 }).imageIndex).toBe(2);
    expect(overlayMachine(low, { type: "image/set", index: 3, count: 0 }).imageIndex).toBe(0);
  });

  it("replaces the whole selection on reset", () => {
    const withOption = overlayMachine(initialOverlayMachine(), {
      type: "selection/set",
      name: "Colour",
      value: "Blue",
    });
    const reset = overlayMachine(withOption, {
      type: "selection/reset",
      options: { Colour: "Sand", Size: "M" },
    });
    expect(reset.selectedOptions).toEqual({ Colour: "Sand", Size: "M" });
    expect(reset.selectedOptions.Colour).not.toBe("Blue");
  });
});
