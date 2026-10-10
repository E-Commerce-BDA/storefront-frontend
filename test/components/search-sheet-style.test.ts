/**
 * Search sheet style contract — .sf-searchsheet paints through vars and
 * Oceanic tokens; state via data-active hooks; no literals outside var()
 * fallbacks.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const cssPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "app", "globals.css");
const rawCss = readFileSync(cssPath, "utf8");
const css = rawCss.replace(/\/\*[\s\S]*?\*\//g, "");

const sheetCss = [...css.matchAll(/\.sf-searchsheet[^{]*\{([^}]*)}/g)].map((m) => m[1]).join("\n");

describe("search sheet style contract", () => {
  it("paints surfaces through vars/tokens", () => {
    for (const prop of [
      /background:\s*var\(--nb-bg/,
      /background:\s*var\(--color-section-bg/,
      /border:\s*1px solid var\(--border/,
      /color:\s*var\(--color-success/,
    ]) {
      expect(sheetCss, `sheet paint must resolve ${prop} through a var`).toMatch(prop);
    }
  });

  it("drives active states through data hooks", () => {
    expect(css).toMatch(/\.sf-searchsheet__depts button\[data-active="true"\]/);
    expect(css).toMatch(/\.sf-searchsheet__cards > button\[data-active="true"\]/);
  });

  it("contains no hex literals outside var() fallbacks", () => {
    const withoutFallbacks = sheetCss.replace(/var\([^()]*\)/g, "");
    const hexes = withoutFallbacks.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
    expect(hexes, `hardcoded paint ${hexes.join(", ")} bypasses theming`).toEqual([]);
  });
});
