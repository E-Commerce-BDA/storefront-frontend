import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const cssPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "app", "globals.css");
const css = readFileSync(cssPath, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

const hoverRules = [
  ...css.matchAll(/\.(?:sf-navlinks|sf-iconbtn|sf-megamenu--nav)[^{]*\{([^}]*)}/g),
].map((match) => match[0]).join("\n");

describe("shell hover + mega-drop style contract (sf-089)", () => {
  it("gates squarish hover borders off disabled cells", () => {
    expect(css).toMatch(/\.sf-navlinks :is\(a, button\):not\(\[aria-disabled="true"\]\):hover/);
    expect(css).toMatch(/\.sf-navlinks :is\(a, button\)\s*\{[^}]*border-radius:\s*var\(--sf-radius-button, 8px\)/);
    expect(css).toMatch(/\.sf-iconbtn:not\(\[disabled\]\):not\(\[aria-disabled="true"\]\):hover/);
    expect(css).toMatch(/\.sf-iconbtn\s*\{[^}]*border-radius:\s*var\(--sf-radius-button, 8px\)/);
    expect(hoverRules).not.toMatch(/:hover[^{]*\{[^}]*opacity/);
  });

  it("drives disclosure, current link and sale treatment through data/aria attrs", () => {
    expect(css).toMatch(/\.sf-navlinks :is\(a, button\)\[aria-expanded="true"\]/);
    expect(css).toMatch(/\.sf-navlinks :is\(a, button\)\[data-current="true"\]/);
    expect(css).toMatch(/\.sf-navlinks :is\(a, button\)\[data-highlight="sale"\]:hover/);
    expect(css).toMatch(/\.sf-navbar\[data-mega-open="true"\]|\.sf-navbar\s*\{[^}]*position:\s*relative/);
  });

  it("drops the mega menu with the prototype motion and kills it under reduced motion", () => {
    expect(css).toMatch(/\.sf-megamenu--nav\s*\{[^}]*animation:\s*sf-mega-drop 180ms ease-out/);
    expect(css).toMatch(/@keyframes sf-mega-drop/);
    const guard = css.match(/@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\n\}/g)?.join("\n") ?? "";
    expect(guard).toMatch(/\.sf-megamenu--nav\s*\{\s*animation:\s*none/);
  });

  it("paints the new shell faces only through tokens", () => {
    for (const token of [
      "--sf-nav-hover-bg",
      "--sf-nav-hover-border",
      "--sf-nav-sale-hover-bg",
      "--sf-nav-icon-border",
      "--sf-shadow-nav",
    ]) {
      expect(css, `shell token ${token} missing`).toMatch(new RegExp(`${token}\\s*:`));
    }
    const withoutFallbacks = hoverRules.replace(/var\([^()]*\)/g, "");
    expect(withoutFallbacks.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).toEqual([]);
  });
});
