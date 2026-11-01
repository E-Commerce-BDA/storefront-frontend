/**
 * CartLineItem style contract — .sf-cartline paints through tokens, drives the
 * pending face off data-pending (an explicit solid, never `opacity`), gates the
 * remove hover on :not([disabled]), keeps a focus ring, and ships no motion.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const cssPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "app", "globals.css");
const rawCss = readFileSync(cssPath, "utf8");
const css = rawCss.replace(/\/\*[\s\S]*?\*\//g, "");

const lineCss = [...css.matchAll(/\.sf-cartline[^{]*\{([^}]*)}/g)].map((m) => m[1]).join("\n");

describe("cart-line-item style contract", () => {
  it("paints name, total and thumb through token fallbacks", () => {
    for (const prop of [
      /color:\s*var\(--cartline-name,\s*var\(--color-ink\)\)/,
      /color:\s*var\(--cartline-total,\s*var\(--color-ink\)\)/,
      /background:\s*var\(--cartline-thumb-bg,\s*var\(--color-image-bg\)\)/,
    ]) {
      expect(lineCss, `line paint must resolve ${prop} through a var`).toMatch(prop);
    }
  });

  it("drives the pending face off data-pending, not opacity", () => {
    expect(css).toMatch(/\.sf-cartline\[data-pending="true"\]/);
    expect(lineCss).not.toMatch(/opacity:/);
  });

  it("gates the remove hover off disabled and keeps a focus ring", () => {
    expect(css).toMatch(/\.sf-cartline__remove:not\(\[disabled\]\):hover/);
    expect(css).toMatch(/\.sf-cartline__remove:focus-visible\s*\{[^}]*outline:/);
  });

  it("contains no hex literals outside var() fallbacks and no motion", () => {
    expect(lineCss).not.toMatch(/transition|animation|@keyframes/);
    const withoutFallbacks = lineCss.replace(/var\([^()]*\)\s*/g, "");
    const hexes = withoutFallbacks.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
    expect(hexes, `hardcoded paint ${hexes.join(", ")} bypasses theming`).toEqual([]);
  });
});
