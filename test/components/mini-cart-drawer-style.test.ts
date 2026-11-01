/**
 * MiniCartDrawer style contract — .sf-minicart paints through tokens, is a fixed
 * modal (position + scrim), keeps a focus ring on the close control, and ships no
 * motion (a drawer sliding under the shopper's cursor would, but that is deferred;
 * v1 opens instantly).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const cssPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "app", "globals.css");
const rawCss = readFileSync(cssPath, "utf8");
const css = rawCss.replace(/\/\*[\s\S]*?\*\//g, "");

const drawerCss = [...css.matchAll(/\.sf-minicart[^{]*\{([^}]*)}/g)].map((m) => m[1]).join("\n");

describe("mini-cart-drawer style contract", () => {
  it("is a fixed full-bleed modal", () => {
    expect(css).toMatch(/\.sf-minicart\s*\{[^}]*position:\s*fixed;[^}]*inset:\s*0;/);
  });

  it("paints panel, scrim and title through token fallbacks", () => {
    for (const prop of [
      /background:\s*var\(--minicart-bg,\s*var\(--color-card\)\)/,
      /background:\s*var\(--minicart-scrim,/,
      /color:\s*var\(--minicart-title,\s*var\(--color-ink\)\)/,
    ]) {
      expect(drawerCss, `drawer paint must resolve ${prop} through a var`).toMatch(prop);
    }
  });

  it("keeps a focus ring on the close control", () => {
    expect(css).toMatch(/\.sf-minicart__x:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--minicart-focus/);
  });

  it("contains no hex literals outside var() fallbacks and no motion", () => {
    expect(drawerCss).not.toMatch(/transition|animation|@keyframes/);
    const withoutFallbacks = drawerCss.replace(/var\([^()]*\)\s*/g, "");
    const hexes = withoutFallbacks.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
    expect(hexes, `hardcoded paint ${hexes.join(", ")} bypasses theming`).toEqual([]);
  });
});
