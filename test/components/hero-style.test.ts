/**
 * HeroSection style contract — .sf-hero paints only through vars, takes the
 * media ratio from the inline var the block sets, drives every state through a
 * data hook, and keeps the hero motion-free (it is a headline, not a carousel).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const cssPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "app", "globals.css");
const rawCss = readFileSync(cssPath, "utf8");
const css = rawCss.replace(/\/\*[\s\S]*?\*\//g, "");

const heroCss = [...css.matchAll(/\.sf-hero[^{]*\{([^}]*)}/g)].map((m) => m[1]).join("\n");

describe("hero style contract", () => {
  it("takes the media ratio from the inline var the block sets", () => {
    expect(heroCss).toMatch(/aspect-ratio:\s*var\(--hero-ratio,/);
  });

  it("paints every surface through a token fallback", () => {
    for (const prop of [
      /background:\s*var\(--hero-bg,\s*var\(--color-section-bg\)\)/,
      /color:\s*var\(--hero-text,\s*var\(--color-ink\)\)/,
      /color:\s*var\(--hero-eyebrow,\s*var\(--text-muted\)\)/,
      /background:\s*var\(--hero-media-bg,\s*var\(--color-accent-50\)\)/,
    ]) {
      expect(heroCss, `hero paint must resolve ${prop} through a var`).toMatch(prop);
    }
  });

  it("drives the column split and centring through data hooks, not classes", () => {
    expect(css).toMatch(/\.sf-hero\[data-align="left"\]\[data-has-image="true"\]/);
    expect(css).toMatch(/\.sf-hero\[data-align="center"\]/);
  });

  it("keeps the hero motion-free by design", () => {
    expect(heroCss).not.toMatch(/transition|animation|@keyframes/);
  });

  it("contains no hex literals outside var() fallbacks", () => {
    const withoutFallbacks = heroCss.replace(/var\([^()]*\)\s*/g, "");
    const hexes = withoutFallbacks.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
    expect(hexes, `hardcoded paint ${hexes.join(", ")} bypasses theming`).toEqual([]);
  });
});
