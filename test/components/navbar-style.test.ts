/**
 * Navbar style contract — .sf-navbar/.sf-navlogo/.sf-navcart/
 * .sf-mobiledrawer paint through --nb-* vars and Oceanic tokens; state
 * via data hooks; slide keyframes buffered; reduced-motion kills all
 * navbar motion; no literals outside var() fallbacks.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const cssPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "app", "globals.css");
const rawCss = readFileSync(cssPath, "utf8");
const css = rawCss.replace(/\/\*[\s\S]*?\*\//g, "");

const navCss = [...css.matchAll(/\.sf-(?:navbar|navlogo|navcart|mobiledrawer)[^{]*\{([^}]*)}/g)]
  .map((m) => m[1])
  .join("\n");

describe("navbar style contract", () => {
  it("paints chrome through --nb-* vars and tokens", () => {
    for (const prop of [
      /background:\s*var\(--nb-bg/,
      /color:\s*var\(--nb-text/,
      /height:\s*var\(--nb-height/,
      /background:\s*var\(--nb-badge-bg/,
      /color:\s*var\(--nb-badge-text/,
    ]) {
      expect(navCss, `navbar paint must resolve ${prop} through a var`).toMatch(prop);
    }
  });

  it("drives sticky/shadow/hidden/side through data hooks", () => {
    expect(css).toMatch(/\.sf-navbar\[data-sticky="always"\]/);
    expect(css).toMatch(/\.sf-navbar\[data-shadow="float"\]/);
    expect(css).toMatch(/\.sf-navbar\[data-shadow="none"\]/);
    expect(css).toMatch(/\.sf-navbar\[data-hidden="true"\]/);
    expect(css).toMatch(/\[data-side="left"\] \.sf-mobiledrawer/);
    expect(css).toMatch(/\[data-side="right"\] \.sf-mobiledrawer/);
  });

  it("slides with buffered travel (wave-park physics, same 8px rule)", () => {
    expect(css).toMatch(/@keyframes sf-drawer-in-left/);
    expect(css).toMatch(/@keyframes sf-drawer-in-right/);
    expect(css).toMatch(/translateX\(calc\(-100% - 8px\)\)/);
    expect(css).toMatch(/translateX\(calc\(100% \+ 8px\)\)/);
  });

  it("scopes drawer hover off disabled and keeps a focus ring", () => {
    expect(css).toMatch(/\.sf-mobiledrawer__x:not\(\[disabled\]\):hover/);
    expect(css).toMatch(/\.sf-mobiledrawer__x:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--color-accent/);
  });

  it("kills navbar + drawer motion under reduced-motion", () => {
    const guard = css.match(/@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\n\}/g)?.join("\n") ?? "";
    expect(guard).toMatch(/\.sf-mobiledrawer/);
    expect(guard).toMatch(/\.sf-navbar\[data-hidden="true"\]/);
  });

  it("contains no hex literals outside var() fallbacks", () => {
    const withoutFallbacks = navCss.replace(/var\([^()]*\)/g, "");
    const hexes = withoutFallbacks.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
    expect(hexes, `hardcoded paint ${hexes.join(", ")} bypasses theming`).toEqual([]);
  });
});
