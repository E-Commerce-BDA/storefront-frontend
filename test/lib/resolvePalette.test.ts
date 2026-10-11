/**
 * Palette resolver-unit — nested per-key merge, motion exclusion, string
 * cleaning, numeric clamps, v1-union check. Pure in → complete out.
 */
import { describe, expect, it } from "vitest";
import { DEFAULT_NAV_SETTINGS } from "@/lib/shell/navSettings";
import { resolveNavSettings } from "@/lib/shell/resolveNav";

const NOW = Date.parse("2026-10-11T12:00:00Z");
const PAL = DEFAULT_NAV_SETTINGS.search.palette;

describe("resolveNavSettings palette", () => {
  it("resolves photo builtins out of nothing", () => {
    const pal = resolveNavSettings({}, NOW).search.palette;
    expect(pal).toEqual(PAL);
    expect(pal.cardBg).toBe("#ffffff");
    expect(pal.backdropAlpha).toBe(72);
    expect(pal.cardType).toBe("row");
    expect(pal.paletteAnimation).toEqual({
      enabled: true,
      durationMs: 320,
      easing: "cubic-bezier(0.32, 0.72, 0.32, 1)",
      travel: "full",
    });
  });

  it("merges palette per-key (shared cardBg must not wipe global quickAddText)", () => {
    const r = resolveNavSettings(
      {
        global: { search: { palette: { quickAddText: "#111111" } } },
        settings: { shared: { search: { palette: { cardBg: "#222222" } } } },
      },
      NOW,
    );
    expect(r.search.palette.cardBg).toBe("#222222");
    expect(r.search.palette.quickAddText).toBe("#111111");
    expect(r.search.palette.blur).toBe(true);
  });

  it("clamps numerics, cleans garbage strings, checks the row union", () => {
    const r = resolveNavSettings(
      {
        settings: {
          shared: {
            search: {
              palette: {
                backdropAlpha: 999,
                blurPx: -5,
                thumbRadius: 99,
                cardBg: "",
                headingColor: 42 as unknown as string,
                cardType: "overlay" as unknown as "row",
                paletteAnimation: { preset: "custom", durationMs: 999, easing: "bogus" },
              },
            },
          },
        },
      },
      NOW,
    );
    const pal = r.search.palette;
    expect(pal.backdropAlpha).toBe(100);
    expect(pal.blurPx).toBe(0);
    expect(pal.thumbRadius).toBe(24);
    expect(pal.cardBg).toBe(PAL.cardBg);
    expect(pal.headingColor).toBe(PAL.headingColor);
    expect(pal.cardType).toBe("row");
    // Bogus easing inherits the oceanic builtin (per-variant cascade).
    expect(pal.paletteAnimation).toEqual({
      enabled: true,
      durationMs: 500,
      easing: "cubic-bezier(0.32, 0.72, 0.32, 1)",
      travel: "full",
    });
  });

  it("clamps admin geometry, passes toggles, checks rowAction (sf-028)", () => {
    const r = resolveNavSettings(
      {
        settings: {
          shared: {
            search: {
              palette: {
                cardMaxWidth: 9999,
                rowsMaxHeight: 10,
                thumbSize: 1,
                inputSize: 99,
                nameSize: 0,
                pillRadius: 5000,
                showFooter: false,
                rowAction: "both" as unknown as "quick-add",
                notifyOnQuickAdd: false,
              },
            },
          },
        },
      },
      NOW,
    );
    const pal = r.search.palette;
    expect(pal.cardMaxWidth).toBe(960);
    expect(pal.rowsMaxHeight).toBe(160);
    expect(pal.thumbSize).toBe(48);
    expect(pal.inputSize).toBe(24);
    expect(pal.nameSize).toBe(14);
    expect(pal.pillRadius).toBe(999);
    expect(pal.showFooter).toBe(false);
    expect(pal.showFilters).toBe(true);
    expect(pal.rowAction).toBe("quick-add");
    expect(pal.notifyOnQuickAdd).toBe(false);
  });

  it("palette motion never leaks into sheet or editorial", () => {
    const r = resolveNavSettings(
      { settings: { shared: { search: { palette: { paletteAnimation: { preset: "flat" } } } } } },
      NOW,
    );
    expect(r.search.palette.paletteAnimation.travel).toBe("minimal");
    expect(r.search.sheetAnimation.travel).toBe("full");
    expect(r.search.editorial.editorialAnimation.travel).toBe("full");
  });
});
