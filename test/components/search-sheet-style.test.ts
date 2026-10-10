/**
 * Search sheet style contract — .sf-searchsheet paints through vars and
 * Oceanic tokens; state via data-active hooks; no literals outside var()
 * fallbacks.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const cssPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "app", "globals.css");
const rawCss = readFileSync(cssPath, "utf8");
const css = rawCss.replace(/\/\*[\s\S]*?\*\//g, "");

const sheetCss = [...css.matchAll(/\.sf-searchsheet[^{]*\{([^}]*)}/g)].map((m) => m[1]).join("\n");

describe("search sheet style contract", () => {
  it("paints surfaces through vars/tokens", () => {
    for (const prop of [
      /background:\s*var\(--nb-bg/,
      /background:\s*var\(--color-section-bg/,
      /border:\s*1px solid var\(--border/,
      /color:\s*var\(--color-success/,
    ]) {
      expect(sheetCss, `sheet paint must resolve ${prop} through a var`).toMatch(prop);
    }
  });

  it("drives active states through data hooks", () => {
    expect(css).toMatch(/\.sf-searchsheet__depts button\[data-active="true"\]/);
    expect(css).toMatch(/\.sf-searchsheet__cards > button\[data-active="true"\]/);
  });

  it("slides without fading (keyframes translate-only, var-driven timing)", () => {
    expect(css).toMatch(/@keyframes sf-sheet-in/);
    const frames = css.match(/@keyframes sf-sheet-in\s*\{[\s\S]*?\n\}/)?.[0] ?? "";
    // Buffered travel (calc(-100% - 8px)) — the wave-park guard blesses this
    // form; bare translateY(-100%) bleeds at some zooms, same physics.
    expect(frames).toMatch(/translateY\(calc\(-100% - 8px\)\)/);
    expect(frames).not.toMatch(/opacity/);
    expect(css).toMatch(/\[data-motion="on"\] \.sf-searchsheet\s*\{[^}]*animation:\s*sf-sheet-in var\(--searchsheet-duration/);
    expect(css).toMatch(/\[data-closing="true"\] \.sf-searchsheet\s*\{[^}]*transform:\s*translateY\(calc\(-100% - 8px\)\)/);
  });

  it("kills sheet motion under reduced-motion", () => {
    const guard = css.match(/@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\n\}/g)?.join("\n") ?? "";
    expect(guard).toMatch(/\.sf-searchsheet/);
  });

  it("contains no hex literals outside var() fallbacks", () => {
    const withoutFallbacks = sheetCss.replace(/var\([^()]*\)/g, "");
    const hexes = withoutFallbacks.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
    expect(hexes, `hardcoded paint ${hexes.join(", ")} bypasses theming`).toEqual([]);
  });
});
