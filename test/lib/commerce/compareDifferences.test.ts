import { describe, expect, it } from "vitest";
import {
  compareRows,
  compareViewMachine,
  initialCompareViewMachine,
  visibleCompareRows,
} from "@/lib/commerce/compare";

const items = [
  { price: 10, category: "Shirts", brandName: "Northwind", stock: "in" },
  { price: 20, category: "Shirts", brandName: "Northwind", stock: "out" },
];

describe("compare differences face (sf-094)", () => {
  it("drops rows whose values all agree", () => {
    const rows = compareRows(items);
    const diff = visibleCompareRows(rows, true);
    expect(diff.map((row) => row.label)).toEqual(["Price", "Availability"]);
    expect(visibleCompareRows(rows, false)).toHaveLength(rows.length);
  });

  it("keeps the full table for a single product — every row is trivially equal", () => {
    const rows = compareRows([items[0]]);
    expect(visibleCompareRows(rows, true)).toHaveLength(rows.length);
  });

  it("owns the face in a pure machine", () => {
    const initial = initialCompareViewMachine();
    const next = compareViewMachine(initial, { type: "face/set", face: "differences" });
    expect(next.face).toBe("differences");
    expect(compareViewMachine(next, { type: "face/set", face: "differences" })).toBe(next);
  });
});
