/**
 * Wave park-position contract — guards the subpixel-bleed bug forever.
 *
 * Bug: the travelling wave layer (::before) parked with a bare `101%`
 * translate, leaving only ~0.5px of hiding margin below/above the button.
 * Subpixel rounding at some zooms/DPRs ate that margin and a 1px wave
 * sliver + faint border fragments bled through at rest — on different
 * edges per size/zoom (right+bottom on sm, corner arcs on lg).
 *
 * Contract: every travelling origin parks at 100% of its own size PLUS a
 * fixed px buffer (>= 8px), which exceeds any rounding error at any zoom.
 * If anyone reintroduces a %-only park, these tests fail with the line.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const cssPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "app", "globals.css");
const rawCss = readFileSync(cssPath, "utf8");
// Strip /* */ comments so prose mentioning old values can't trip the ban.
const css = rawCss.replace(/\/\*[\s\S]*?\*\//g, "");

const MIN_PARK_BUFFER_PX = 8;

describe("wave park position (subpixel-bleed guard)", () => {
  it("contains no bare-percentage parks (the original bug)", () => {
    // Matches translateX/Y(±101%) — a %-only park has ~0.5px of hiding
    // margin and bleeds at some zooms. calc(100% + Npx) does NOT match.
    const barePark = css.match(/translate[XY]\(\s*-?\d+(\.\d+)?%\s*\)/g) ?? [];
    expect(
      barePark,
      `bare-percentage park transforms bleed at some zooms; use calc(100% + Npx) with N >= ${MIN_PARK_BUFFER_PX}. Found: ${barePark.join(", ")}`,
    ).toEqual([]);
  });

  it("parks every travelling origin with a px buffer >= 8px", () => {
    const parks: Array<{ origin: string; pattern: RegExp }> = [
      { origin: "bottom", pattern: /transform:\s*translateY\(\s*calc\(\s*100%\s*\+\s*(\d+)px\s*\)\s*\)/ },
      { origin: "top", pattern: /transform:\s*translateY\(\s*calc\(\s*-100%\s*-\s*(\d+)px\s*\)\s*\)/ },
      { origin: "left", pattern: /transform:\s*translateX\(\s*calc\(\s*-100%\s*-\s*(\d+)px\s*\)\s*\)/ },
      { origin: "right", pattern: /transform:\s*translateX\(\s*calc\(\s*100%\s*\+\s*(\d+)px\s*\)\s*\)/ },
    ];
    for (const { origin, pattern } of parks) {
      const match = css.match(pattern);
      expect(match, `missing px-buffered park for wave origin "${origin}"`).not.toBeNull();
      const bufferPx = Number(match?.[1]);
      expect(
        bufferPx,
        `park buffer for origin "${origin}" is ${bufferPx}px; needs >= ${MIN_PARK_BUFFER_PX}px to survive rounding at any zoom`,
      ).toBeGreaterThanOrEqual(MIN_PARK_BUFFER_PX);
    }
  });

  it("hover end-state still reaches translate(0, 0) (full coverage)", () => {
    expect(css).toMatch(/transform:\s*translate\(\s*0\s*,\s*0\s*\)/);
  });

  it("keeps the clip/positioning the park depends on", () => {
    // The park only hides the layer because .sf-btn clips it.
    expect(css).toMatch(/\.sf-btn\s*\{[^}]*overflow:\s*hidden/);
    expect(css).toMatch(/\.sf-btn\s*\{[^}]*position:\s*relative/);
  });

  it("has no per-variant wave geometry (one shared rule for all buttons)", () => {
    // Variants/sizes must differ by vars only; a second geometry copy can
    // park at a different (buggy) distance again.
    expect(css).not.toMatch(/data-variant|sf-btn--/);
  });
});
