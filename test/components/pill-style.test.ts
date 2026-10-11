/**
 * Pill style contract — .sf-pill paints through --pill-* vars and Oceanic
 * tokens; state via data hooks; active face never hover-repaints; disabled
 * faces are explicit solids (no opacity); no literals outside var() fallbacks.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const cssPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "app", "globals.css");
const rawCss = readFileSync(cssPath, "utf8");
const css = rawCss.replace(/\/\*[\s\S]*?\*\//g, "");

const pillCss = [...css.matchAll(/\.sf-pill[^{]*\{([^}]*)}/g)].map((m) => m[1]).join("\n");

describe("pill style contract", () => {
  it("paints faces through --pill-* vars and tokens", () => {
    for (const prop of [
      /background:\s*var\(--pill-bg/,
      /color:\s*var\(--pill-active-text/,
      /border-color:\s*var\(--pill-border/,
      /background:\s*var\(--pill-action-bg/,
      /background:\s*var\(--pill-added-bg/,
    ]) {
      expect(pillCss, `pill paint must resolve ${prop} through a var`).toMatch(prop);
    }
  });

  it("drives variant + active + action-state through data hooks", () => {
    expect(css).toMatch(/\.sf-pill\[data-pill="filter"\]\[data-active="true"\]/);
    expect(css).toMatch(/\.sf-pill\[data-pill="chip"\]/);
    expect(css).toMatch(/\.sf-pill\[data-pill="action"\]\[data-state="added"\]/);
  });

  it("scopes hover off the active face and off disabled", () => {
    expect(css).toMatch(/\.sf-pill:not\(\[data-active="true"\]\):not\(\[disabled\]\):hover/);
  });

  it("keeps a visible focus ring and solid disabled faces", () => {
    expect(css).toMatch(/\.sf-pill:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--color-accent/);
    expect(css).toMatch(/\.sf-pill\[disabled\]\s*\{[^}]*cursor:\s*not-allowed/);
    expect(pillCss).not.toMatch(/opacity/);
  });

  it("contains no hex literals outside var() fallbacks", () => {
    const withoutFallbacks = pillCss.replace(/var\([^()]*\)/g, "");
    const hexes = withoutFallbacks.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
    expect(hexes, `hardcoded paint ${hexes.join(", ")} bypasses theming`).toEqual([]);
  });
});
