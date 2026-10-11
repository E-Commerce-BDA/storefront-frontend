/**
 * Search palette style contract — .sf-searchpalette paints through --pl-*
 * vars (+ --pill-* faces) and Oceanic tokens; state via data hooks;
 * centered modal geometry; no literals outside var() fallbacks.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const cssPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "app", "globals.css");
const rawCss = readFileSync(cssPath, "utf8");
const css = rawCss.replace(/\/\*[\s\S]*?\*\//g, "");

const palCss = [...css.matchAll(/\.sf-searchpalette[^{]*\{([^}]*)}/g)].map((m) => m[1]).join("\n");

describe("search palette style contract", () => {
  it("paints surfaces through --pl-* vars and tokens", () => {
    for (const prop of [
      /background:\s*var\(--pl-card/,
      /color:\s*var\(--pl-input/,
      /color:\s*var\(--pl-icon/,
      /border-radius:\s*var\(--pl-thumb/,
      /color:\s*var\(--pl-rating/,
    ]) {
      expect(palCss, `palette paint must resolve ${prop} through a var`).toMatch(prop);
    }
  });

  it("is a centered modal on a dim wash (never a sheet slide)", () => {
    expect(palCss).toMatch(/position:\s*fixed/);
    expect(palCss).toMatch(/inset:\s*0/);
    expect(palCss).toMatch(/max-width:\s*720px/);
    expect(palCss).toMatch(/border-radius:\s*20px/);
    expect(palCss).toMatch(/margin:\s*auto/);
  });

  it("fits the viewport (sf-027: card backstop, sticky footer, compact rows)", () => {
    expect(css).toMatch(/\.sf-searchpalette__card\s*\{[^}]*max-height:\s*calc\(100dvh/);
    expect(css).toMatch(/\.sf-searchpalette__card\s*\{[^}]*overflow-y:\s*auto/);
    expect(css).toMatch(/\.sf-searchpalette__footer\s*\{[^}]*position:\s*sticky/);
    expect(css).toMatch(/\.sf-searchpalette__footer\s*\{[^}]*bottom:\s*0/);
    expect(css).toMatch(/\.sf-searchpalette__thumb\s*\{[^}]*width:\s*64px/);
  });

  it("drives blur, card variant and keyboard-active rows through data hooks", () => {
    expect(css).toMatch(/\.sf-searchpalette\[data-blur="true"\] \.sf-searchpalette__backdrop/);
    expect(css).toMatch(/\.sf-searchpalette__row\[data-active="true"\]/);
    // Active filter face never hover-repaints (Pill contract owns this;
    // palette CSS must not add a competing :hover on pills).
    expect(palCss).not.toMatch(/\.sf-pill[^{]*:hover/);
  });

  it("arrives with var-driven fade + scale (modal arrival, never translate-slide)", () => {
    expect(css).toMatch(/@keyframes sf-palette-in/);
    const frames = css.match(/@keyframes sf-palette-in\s*\{[\s\S]*?\n\}/)?.[0] ?? "";
    expect(frames).toMatch(/opacity/);
    expect(frames).toMatch(/scale\(0\.97\)/);
    expect(frames).not.toMatch(/translateY\(calc\(-100% - 8px\)\)/);
    expect(css).toMatch(/\[data-motion="on"\] \.sf-searchpalette__card\s*\{[^}]*animation:\s*sf-palette-in var\(--pl-duration/);
    expect(css).toMatch(/\[data-closing="true"\] \.sf-searchpalette__card\s*\{[^}]*opacity:\s*0/);
  });

  it("reads admin geometry through vars (sf-028)", () => {
    for (const prop of [
      /max-width:\s*var\(--pl-maxw/,
      /max-height:\s*var\(--pl-rows-max/,
      /width:\s*var\(--pl-thumb-size/,
      /font-size:\s*var\(--pl-input-size/,
      /font-size:\s*var\(--pl-name-size/,
      /border-radius:\s*var\(--pill-radius/,
    ]) {
      expect(palCss, `palette geometry must resolve ${prop} through a var`).toMatch(prop);
    }
  });

  it("pins the footer flush in both short and tall cases (sf-028)", () => {
    expect(css).toMatch(/\.sf-searchpalette__card\s*\{[^}]*flex-direction:\s*column/);
    expect(css).toMatch(/\.sf-searchpalette__rows\s*\{[^}]*flex:\s*1 1 auto/);
    expect(css).toMatch(/\.sf-searchpalette__footer\s*\{[^}]*margin:\s*auto -22px -16px/);
  });

  it("scrolls rows internally and collapses columns on narrow screens", () => {
    expect(palCss).toMatch(/max-height:\s*300px/);
    expect(palCss).toMatch(/overflow-y:\s*auto/);
    expect(css).toMatch(/max-width:\s*640px[\s\S]*?\.sf-searchpalette__columns\s*\{[^}]*grid-template-columns:\s*1fr/);
  });

  it("kills palette motion under reduced-motion", () => {
    const guard = css.match(/@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\n\}/g)?.join("\n") ?? "";
    expect(guard).toMatch(/\.sf-searchpalette__card/);
  });

  it("contains no hex literals outside var() fallbacks", () => {
    const withoutFallbacks = palCss.replace(/var\([^()]*\)/g, "");
    const hexes = withoutFallbacks.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
    expect(hexes, `hardcoded paint ${hexes.join(", ")} bypasses theming`).toEqual([]);
  });
});
