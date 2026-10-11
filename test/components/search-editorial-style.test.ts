/**
 * Search editorial style contract — .sf-editorial paints through --ed-*
 * vars and Oceanic tokens; state via data hooks; scrollable takeover;
 * no literals outside var() fallbacks.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const cssPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "app", "globals.css");
const rawCss = readFileSync(cssPath, "utf8");
const css = rawCss.replace(/\/\*[\s\S]*?\*\//g, "");

const edCss = [...css.matchAll(/\.sf-editorial[^{]*\{([^}]*)}/g)].map((m) => m[1]).join("\n");

describe("search editorial style contract", () => {
  it("paints surfaces through --ed-* vars and tokens", () => {
    for (const prop of [
      /background:\s*var\(--ed-bg/,
      /color:\s*var\(--ed-input/,
      /border-bottom:\s*2px solid var\(--ed-underline/,
      /background:\s*var\(--ed-tab-bg/,
      /border-radius:\s*var\(--ed-radius/,
      /background:\s*var\(--color-image-bg/,
    ]) {
      expect(edCss, `editorial paint must resolve ${prop} through a var`).toMatch(prop);
    }
  });

  it("is a scrollable full-screen takeover", () => {
    expect(edCss).toMatch(/position:\s*fixed/);
    expect(edCss).toMatch(/inset:\s*0/);
    expect(edCss).toMatch(/overflow-y:\s*auto/);
  });

  it("drives blur, tabs, cards and active states through data hooks", () => {
    expect(css).toMatch(/\.sf-editorial\[data-blur="true"\]/);
    expect(css).toMatch(/\.sf-editorial\[data-tabshape="pill"\] \.sf-editorial__tabs button\[data-active="true"\]/);
    expect(css).toMatch(/\.sf-editorial__card\[data-active="true"\] \.sf-editorial__media/);
    // Inactive-only hover: recoloring the active pill's text would ink
    // white-on-ink invisible (bare :hover matches everything).
    expect(css).toMatch(/\.sf-editorial__tabs button:not\(\[data-active="true"\]\):hover/);
  });

  it("fades with var-driven timing (takeover arrival, never a sheet slide)", () => {
    expect(css).toMatch(/@keyframes sf-editorial-in/);
    const frames = css.match(/@keyframes sf-editorial-in\s*\{[\s\S]*?\n\}/)?.[0] ?? "";
    expect(frames).toMatch(/opacity/);
    expect(frames).not.toMatch(/translateY\(calc\(-100% - 8px\)\)/);
    expect(css).toMatch(/\[data-motion="on"\] \.sf-editorial__panel\s*\{[^}]*animation:\s*sf-editorial-in var\(--ed-duration/);
    expect(css).toMatch(/\[data-closing="true"\] \.sf-editorial__panel\s*\{[^}]*opacity:\s*0/);
  });

  it("collapses to 2-up then 1-up (tall media never shrinks to a sliver)", () => {
    expect(css).toMatch(/grid-template-columns:\s*repeat\(4, 1fr\)/);
    expect(css).toMatch(/max-width:\s*1024px[\s\S]*?repeat\(2, 1fr\)/);
    expect(css).toMatch(/max-width:\s*560px[\s\S]*?grid-template-columns:\s*1fr/);
    expect(edCss).toMatch(/aspect-ratio:\s*4 \/ 5/);
  });

  it("kills editorial motion under reduced-motion", () => {
    const guard = css.match(/@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\n\}/g)?.join("\n") ?? "";
    expect(guard).toMatch(/\.sf-editorial__panel/);
  });

  it("contains no hex literals outside var() fallbacks", () => {
    const withoutFallbacks = edCss.replace(/var\([^()]*\)/g, "");
    const hexes = withoutFallbacks.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
    expect(hexes, `hardcoded paint ${hexes.join(", ")} bypasses theming`).toEqual([]);
  });
});
