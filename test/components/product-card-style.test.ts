/**
 * ProductCard style contract — .sf-productcard paints through --pc-*
 * vars and tokens; state via data hooks; hover-only CTA layer with
 * touch rules; reduced-motion instant; no literals outside var()
 * fallbacks.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const cssPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "app", "globals.css");
const rawCss = readFileSync(cssPath, "utf8");
const css = rawCss.replace(/\/\*[\s\S]*?\*\//g, "");

const pcCss = [...css.matchAll(/\.sf-productcard[^{]*\{([^}]*)}/g)].map((m) => m[1]).join("\n");

describe("product card style contract", () => {
  it("paints card + info through --pc-* vars and tokens", () => {
    for (const prop of [
      /background:\s*var\(--pc-bg/,
      /border:\s*1px solid var\(--pc-border/,
      /aspect-ratio:\s*var\(--pc-ratio/,
      /border-radius:\s*var\(--pc-radius/,
      /border-radius:\s*var\(--pc-media-radius/,
      /padding:\s*var\(--pc-pad/,
      /mix-blend-mode:\s*var\(--pc-image-blend/,
      /object-fit:\s*var\(--pc-image-fit/,
      /color:\s*var\(--pc-name/,
      /color:\s*var\(--pc-price/,
      /text-align:\s*var\(--pc-align/,
    ]) {
      expect(pcCss, `card paint must resolve ${prop} through a var`).toMatch(prop);
    }
  });

  it("drives badge/CTA/stock/hover/card-type through data hooks", () => {
    expect(css).toMatch(/\.sf-productcard\[data-badgepos="right"\] \.sf-productcard__badge/);
    expect(css).toMatch(/\.sf-productcard\[data-ctapos="right"\] \.sf-productcard__ctas/);
    expect(css).toMatch(/\.sf-productcard\[data-stock="out"\]/);
    expect(css).toMatch(/\.sf-productcard\[data-hover="actions"\] \.sf-productcard__media:hover \.sf-productcard__ctas/);
    expect(css).toMatch(/\.sf-productcard\[data-hover="zoom"\] \.sf-productcard__media:hover \.sf-productcard__cover/);
    expect(css).toMatch(/\.sf-productcard\[data-card-type="minimal"\]/);
    expect(css).toMatch(/\.sf-productcard\[data-card-type="compact"\]/);
    expect(css).toMatch(/\.sf-productcard\[data-card-type="overlay"\]/);
    expect(css).toMatch(/\.sf-productcard\[data-card-type="horizontal"\]/);
    // Focus parity: keyboard reveals what hover reveals.
    expect(css).toMatch(/\.sf-productcard\[data-hover="actions"\] \.sf-productcard__media:focus-within \.sf-productcard__ctas/);
  });

  it("hides CTAs on touch unless opted in (tap = open)", () => {
    expect(css).toMatch(/@media \(hover: none\)/);
    expect(css).toMatch(/\.sf-productcard\[data-touch-actions="false"\] \.sf-productcard__ctas\s*\{[^}]*display:\s*none/);
    expect(css).toMatch(/\.sf-productcard\[data-touch-actions="true"\] \.sf-productcard__ctas/);
  });

  it("kills hover motion under reduced-motion (instant reveal)", () => {
    const guard = css.match(/@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\n\}/g)?.join("\n") ?? "";
    expect(guard).toMatch(/\.sf-productcard__hoverimg/);
    expect(guard).toMatch(/\.sf-productcard__ctas/);
    expect(guard).toMatch(/\.sf-productcard\[data-hover="zoom"\]/);
  });

  it("contains no hex literals outside var() fallbacks", () => {
    const withoutFallbacks = pcCss.replace(/var\([^()]*\)/g, "");
    const hexes = withoutFallbacks.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
    expect(hexes, `hardcoded paint ${hexes.join(", ")} bypasses theming`).toEqual([]);
  });
});
