import { describe, expect, it } from "vitest";
import {
  addCompareId,
  COMPARE_LIMIT,
  compareQuery,
  parseCompareQuery,
  removeCompareId,
} from "@/lib/commerce/compare";

describe("compare id rules", () => {
  it("dedupes and caps at four, refusing rather than dropping", () => {
    let ids: string[] = [];
    for (let i = 1; i <= 5; i += 1) {
      ids = addCompareId(ids, `p${i}`).ids;
    }
    expect(ids).toHaveLength(COMPARE_LIMIT);
    const refused = addCompareId(ids, "p5");
    expect(refused.added).toBe(false);
    expect(refused.full).toBe(true);
  });

  it("toggles cleanly", () => {
    const once = addCompareId(["p1"], "p2");
    expect(once.ids).toEqual(["p1", "p2"]);
    expect(removeCompareId(once.ids, "p1")).toEqual(["p2"]);
    expect(addCompareId(["p1"], "p1").added).toBe(false);
  });

  it("round-trips a canonical shareable query", () => {
    expect(compareQuery(["b", "a", "b", "c"])).toBe("?ids=b,a,c");
    expect(compareQuery([])).toBe("");
    expect(parseCompareQuery("b, a, ,c")).toEqual(["b", "a", "c"]);
    expect(parseCompareQuery(null)).toEqual([]);
    expect(parseCompareQuery("a,b,c,d,e")).toHaveLength(4);
  });
});
