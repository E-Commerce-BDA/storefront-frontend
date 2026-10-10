/**
 * Inspect style contract — .sf-inspect paints through vars/navbar tokens;
 * oceanic scale+rise keyframes (travel belongs to sheets, never modals);
 * reduced-motion guard covers the block; no literals outside var()
 * fallbacks.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const cssPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "app", "globals.css");
const rawCss = readFileSync(cssPath, "utf8");
const css = rawCss.replace(/\/\*[\s\S]*?\*\//g, "");

const inspectCss = [...css.matchAll(/\.sf-(inspect|spotlight)[^{]*\{([^}]*)}/g)].map((m) => m[2]).join("\n");

describe("inspect style contract", () => {
  it("paints the frame through vars/tokens", () => {
    for (const prop of [
      /background:\s*var\(--nb-bg/,
      /color:\s*var\(--nb-text/,
      /background:\s*var\(--color-button-bg/,
      /background:\s*var\(--color-section-bg/,
      /border:\s*1px solid var\(--color-accent\)/,
    ]) {
      expect(inspectCss, `inspect paint must resolve ${prop} through a var`).toMatch(prop);
    }
  });

  it("animates scale+rise (modal travel), never sheet slides or fades", () => {
    const frames = css.match(/@keyframes sf-inspect-in\s*\{[\s\S]*?\n\}/)?.[0] ?? "";
    expect(frames).toMatch(/scale\(0\.96\)/);
    expect(frames).toMatch(/translateY\(12px\)/);
    expect(frames).not.toMatch(/translateY\(-100%/);
    expect(frames).not.toMatch(/opacity/);
    expect(css).toMatch(/\[data-motion="on"\] \.sf-inspect\s*\{[^}]*animation:\s*sf-inspect-in var\(--inspect-duration/);
    expect(css).toMatch(/\[data-closing="true"\] \.sf-inspect\s*\{[^}]*transform:/);
  });

  it("kills inspect motion under reduced-motion", () => {
    const guards = css.match(/@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\n\}/g)?.join("\n") ?? "";
    expect(guards).toMatch(/\.sf-inspect/);
  });

  it("contains no hex literals outside var() fallbacks", () => {
    const withoutFallbacks = inspectCss.replace(/var\([^()]*\)/g, "");
    const hexes = withoutFallbacks.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
    expect(hexes, `hardcoded paint ${hexes.join(", ")} bypasses theming`).toEqual([]);
  });
});
