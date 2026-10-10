/**
 * Announcement style contract — .sf-announce paints through --nb-announce-*
 * vars (fallbacks mirror DEFAULT_NAV_SETTINGS). No literals outside var()
 * fallbacks; arrows/dismiss inherit currentColor (no color props, ever).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const cssPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "app", "globals.css");
const rawCss = readFileSync(cssPath, "utf8");
const css = rawCss.replace(/\/\*[\s\S]*?\*\//g, "");

const announceCss = [...css.matchAll(/\.sf-announce[^{]*\{([^}]*)}/g)].map((m) => m[1]).join("\n");

describe("announcement style contract", () => {
  it("paints the bar through --nb-announce-* vars", () => {
    for (const prop of [
      /background:\s*var\(--nb-announce-bg/,
      /color:\s*var\(--nb-announce-text/,
    ]) {
      expect(announceCss, `announce paint must resolve ${prop} through a var`).toMatch(prop);
    }
  });

  it("contains no hex literals outside var() fallbacks", () => {
    const withoutFallbacks = announceCss.replace(/var\([^()]*\)/g, "");
    const hexes = withoutFallbacks.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
    expect(hexes, `hardcoded paint ${hexes.join(", ")} bypasses theming`).toEqual([]);
  });
});
