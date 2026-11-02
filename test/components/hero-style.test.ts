/**
 * HeroSection style contract — .sf-hero paints only through vars, takes the
 * media ratio from the inline var the block sets, drives every state through a
 * data hook, and keeps the hero motion-free (it is a headline, not a carousel).
 *
 * The multi-slide shell is deliberately a *different* class vocabulary
 * (`.sf-slideshow`), because "the hero block has no motion in it" is a promise
 * this file can only keep if the animated rules are not named `.sf-hero*`.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { HERO_DEFAULT_RATIO } from "@/lib/sections/hero";

const cssPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "app", "globals.css");
const rawCss = readFileSync(cssPath, "utf8");
const css = rawCss.replace(/\/\*[\s\S]*?\*\//g, "");

const heroCss = [...css.matchAll(/\.sf-hero[^{]*\{([^}]*)}/g)].map((m) => m[1]).join("\n");

describe("hero style contract", () => {
  it("takes the media ratio from the inline var the block sets", () => {
    expect(heroCss).toMatch(/aspect-ratio:\s*var\(--hero-ratio,/);
  });

  it("states the house ratio once — the resolver constant is the CSS fallback", () => {
    const fallback = heroCss.match(/aspect-ratio:\s*var\(--hero-ratio,\s*([^)]+)\)/)?.[1];
    expect(fallback).toBe(HERO_DEFAULT_RATIO);
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

  it("drives the column split, centring and height through data hooks, not classes", () => {
    expect(css).toMatch(/\.sf-hero\[data-align="left"\]\[data-has-image="true"\]/);
    expect(css).toMatch(/\.sf-hero\[data-align="center"\]/);
    expect(css).toMatch(/\.sf-hero\[data-height="viewport"\]/);
  });

  it("keeps the hero motion-free by design", () => {
    expect(heroCss).not.toMatch(/transition|animation|@keyframes/);
  });

  it("puts the slideshow's motion in its own vocabulary, and still honours reduced motion", () => {
    expect(css).toMatch(/\.sf-slideshow__slide\s*\{\s*animation:/);
    expect(css).toMatch(
      /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[^}]*\.sf-slideshow__slide\s*\{\s*animation:\s*none/,
    );
  });

  it("contains no hex literals outside var() fallbacks", () => {
    const withoutFallbacks = heroCss.replace(/var\([^()]*\)\s*/g, "");
    const hexes = withoutFallbacks.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
    expect(hexes, `hardcoded paint ${hexes.join(", ")} bypasses theming`).toEqual([]);
  });
});
