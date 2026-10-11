/**
 * Editorial resolver-unit — nested per-key merge, motion exclusion, string
 * cleaning, numeric clamps, v1-union checks. Pure in → complete out.
 */
import { describe, expect, it } from "vitest";
import { DEFAULT_NAV_SETTINGS } from "@/lib/shell/navSettings";
import { resolveNavSettings } from "@/lib/shell/resolveNav";

const NOW = Date.parse("2026-10-11T12:00:00Z");
const ED = DEFAULT_NAV_SETTINGS.search.editorial;

describe("resolveNavSettings editorial", () => {
  it("resolves photo builtins out of nothing", () => {
    const ed = resolveNavSettings({}, NOW).search.editorial;
    expect(ed).toEqual(ED);
    expect(ed.bg).toBe("#f5fafc");
    expect(ed.tabShape).toBe("pill");
    expect(ed.cardType).toBe("standard");
    expect(ed.editorialAnimation).toEqual({
      enabled: true,
      durationMs: 320,
      easing: "cubic-bezier(0.32, 0.72, 0.32, 1)",
      travel: "full",
    });
  });

  it("merges editorial per-key (shared bg must not wipe global tabShape)", () => {
    const r = resolveNavSettings(
      {
        global: { search: { editorial: { tabActiveBg: "#111111" } } },
        settings: { shared: { search: { editorial: { bg: "#222222" } } } },
      },
      NOW,
    );
    expect(r.search.editorial.bg).toBe("#222222");
    expect(r.search.editorial.tabActiveBg).toBe("#111111");
    expect(r.search.editorial.blur).toBe(false);
  });

  it("clamps numerics, cleans garbage strings, checks v1 unions", () => {
    const r = resolveNavSettings(
      {
        settings: {
          shared: {
            search: {
              editorial: {
                bgAlpha: 999,
                blurPx: -5,
                cardRadius: 99,
                bg: "",
                eyebrow: 42 as unknown as string,
                tabShape: "underline" as unknown as "pill",
                cardType: "overlay" as unknown as "standard",
                editorialAnimation: { preset: "custom", durationMs: 999, easing: "bogus" },
              },
            },
          },
        },
      },
      NOW,
    );
    const ed = r.search.editorial;
    expect(ed.bgAlpha).toBe(100);
    expect(ed.blurPx).toBe(0);
    expect(ed.cardRadius).toBe(24);
    expect(ed.bg).toBe(ED.bg);
    expect(ed.eyebrow).toBe(ED.eyebrow);
    expect(ed.tabShape).toBe("pill");
    expect(ed.cardType).toBe("standard");
    expect(ed.editorialAnimation).toEqual({ enabled: true, durationMs: 500, easing: "ease-out", travel: "full" });
  });

  it("sheet and editorial motions never leak across variants", () => {
    const r = resolveNavSettings(
      { settings: { shared: { search: { editorial: { editorialAnimation: { preset: "flat" } } } } } },
      NOW,
    );
    expect(r.search.editorial.editorialAnimation.travel).toBe("minimal");
    expect(r.search.sheetAnimation).toEqual({
      enabled: true,
      durationMs: 240,
      easing: "ease-out",
      travel: "full",
    });
  });
});
