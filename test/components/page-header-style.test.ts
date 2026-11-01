/**
 * PageHeader style contract — .sf-page-header paints through vars, draws the
 * crumb separator as content (not markup), keeps a visible focus ring on crumb
 * links, styles the current crumb off aria-current, and ships no motion.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const cssPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "app", "globals.css");
const rawCss = readFileSync(cssPath, "utf8");
const css = rawCss.replace(/\/\*[\s\S]*?\*\//g, "");

const headerCss = [...css.matchAll(/\.sf-page-header[^{]*\{([^}]*)}/g)].map((m) => m[1]).join("\n");

describe("page-header style contract", () => {
  it("draws the separator as pseudo-content, not a crumb in the DOM", () => {
    expect(css).toMatch(/\.sf-page-header__crumb \+ \.sf-page-header__crumb::before\s*\{[^}]*content:/);
  });

  it("paints every colour through a token fallback", () => {
    for (const prop of [
      /color:\s*var\(--page-header-crumb,\s*var\(--text-muted\)\)/,
      /color:\s*var\(--page-header-title,\s*var\(--color-ink\)\)/,
      /color:\s*var\(--page-header-separator,\s*var\(--border\)\)/,
    ]) {
      expect(headerCss, `header paint must resolve ${prop} through a var`).toMatch(prop);
    }
  });

  it("styles the current crumb off aria-current, not a class", () => {
    expect(css).toMatch(/\.sf-page-header__crumb span\[aria-current="page"\]/);
  });

  it("keeps a visible focus ring on crumb links", () => {
    expect(css).toMatch(/\.sf-page-header__crumb a:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--page-header-focus/);
  });

  it("ships no motion", () => {
    expect(headerCss).not.toMatch(/transition|animation|@keyframes/);
  });

  it("contains no hex literals outside var() fallbacks", () => {
    const withoutFallbacks = headerCss.replace(/var\([^()]*\)\s*/g, "");
    const hexes = withoutFallbacks.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
    expect(hexes, `hardcoded paint ${hexes.join(", ")} bypasses theming`).toEqual([]);
  });
});
