import { describe, expect, it } from "vitest";
import {
  activePdpTab,
  groupPdpSections,
  initialPdpTabsMachine,
  pdpTabsMachine,
  type PdpTabModel,
} from "@/lib/pdp/tabs";
import type { SectionViewModel } from "@/lib/sections/viewModels";

const model = (type: SectionViewModel["type"], key: string): SectionViewModel =>
  ({ key, type }) as SectionViewModel;

describe("PDP tab resolver (sf-092)", () => {
  it("groups only tabbable sections in the prototype's order and leaves the rest in flow", () => {
    const { tabs, rest } = groupPdpSections([
      model("pdp_faq", "faq"),
      model("pdp_trust", "trust"),
      model("pdp_reviews", "reviews"),
      model("pdp_description", "desc"),
      model("pdp_details", "details"),
    ]);
    expect(tabs.map((tab) => tab.id)).toEqual(["description", "details", "reviews", "faq"]);
    expect(tabs[2]?.label).toBe("Reviews");
    expect(rest.map((item) => item.key)).toEqual(["trust"]);
  });

  it("omits empty tabs and ignores a group with no tab mapping", () => {
    const { tabs } = groupPdpSections([model("banner", "promo")]);
    expect(tabs).toEqual([]);
  });

  it("keeps the tab machine pure and falls back to the first visible tab", () => {
    const initial = initialPdpTabsMachine();
    expect(initial.active).toBe("description");
    const next = pdpTabsMachine(initial, { type: "tab/set", id: "faq" });
    expect(next.active).toBe("faq");
    expect(pdpTabsMachine(next, { type: "tab/set", id: "faq" })).toBe(next);

    const onlyReviews: PdpTabModel[] = [{ id: "reviews", label: "Reviews", models: [] }];
    expect(activePdpTab(initial, onlyReviews)).toBe("reviews");
    expect(activePdpTab(initial, [])).toBe("description");
  });
});
