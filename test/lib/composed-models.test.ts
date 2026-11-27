import { describe, expect, it } from "vitest";
import { railStep, resolveRail } from "@/lib/sections/railModel";
import { resolveMegaMenu } from "@/lib/shell/megaMenuModel";
import { resolveOrderSummary } from "@/lib/order/summaryModel";
import { resolveTimeline } from "@/lib/order/timeline";
import type { MegaMenuGroup } from "@ecom/contracts";

const group = (over: Partial<MegaMenuGroup> = {}): MegaMenuGroup => ({
  title: "Shop",
  items: [{ label: "All", href: "/products" }],
  ...over,
});

describe("paginated rail model", () => {
  it("clamps pages and wraps or caps the step", () => {
    const rail = resolveRail({ count: 9, pageSize: 4, index: 99 });
    expect(rail.pages).toBe(3);
    expect(rail.index).toBe(2);
    expect(rail.dots).toEqual([0, 1, 2]);
    expect(railStep(2, 3, 1, true)).toBe(0);
    expect(railStep(0, 3, -1, true)).toBe(2);
    expect(railStep(2, 3, 1, false)).toBe(2);
    expect(railStep(0, 1, 1, true)).toBe(0);
    expect(resolveRail({ pageSize: 99 }).pageSize).toBe(12);
    expect(resolveRail(undefined, { motion: "off" }).motion).toBe("off");
  });
});

describe("mega menu model", () => {
  it("caps groups, columns and items from the 2.2.0 shape", () => {
    const groups = Array.from({ length: 8 }, (_, i) =>
      group({ title: `Group ${i}`, columns: 99, items: [{ label: "All", href: "/products" }] }),
    );
    const resolved = resolveMegaMenu(groups, undefined);
    expect(resolved.groups).toHaveLength(6);
    expect(resolved.groups[0].columns).toBe(4);
    expect(resolved.ariaLabel).toBe("Browse");
    expect(resolveMegaMenu([group()], undefined, { ariaLabel: "Shop" }).ariaLabel).toBe("Shop");
    expect(resolveMegaMenu([group({ columns: 0 })], { maxColumns: 2 }).groups[0].columns).toBe(1);
  });
});

describe("order summary model", () => {
  it("clamps progress and derives the free-shipping face", () => {
    const short = resolveOrderSummary({ subtotal: 60, freeShipThreshold: 120 });
    expect(short.remaining).toBe(60);
    expect(short.progress).toBe(50);
    expect(short.freeShip).toBe(false);
    const over = resolveOrderSummary({ subtotal: 130, discount: 10, shipping: 5, tax: 2 }, { freeShipThreshold: 120 });
    expect(over.freeShip).toBe(true);
    expect(over.progress).toBe(100);
    expect(over.total).toBe(127);
    expect(resolveOrderSummary({ subtotal: 10, freeShipThreshold: 0 }).progress).toBe(100);
  });
});

describe("order timeline model", () => {
  it("maps each status to one stage and never claims a later one", () => {
    expect(resolveTimeline("paid").stage).toBe("paid");
    expect(resolveTimeline("IN_TRANSIT").stage).toBe("shipped");
    expect(resolveTimeline("something_new").stage).toBe("placed");
    const delivered = resolveTimeline("delivered");
    expect(delivered.index).toBe(4);
    expect(delivered.steps.map((step) => step.state)).toEqual([
      "done",
      "done",
      "done",
      "done",
      "active",
    ]);
  });
});
