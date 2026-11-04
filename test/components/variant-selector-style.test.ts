/**
 * VariantSelector style contract — three faces from data-display, selection via
 * data-active, unavailability via aria-disabled (a solid, never opacity), and
 * hover that never repaints a face the shopper already has.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const cssPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "app", "globals.css");
const rawCss = readFileSync(cssPath, "utf8");
const css = rawCss.replace(/\/\*[\s\S]*?\*\//g, "");

const variantsCss = [...css.matchAll(/\.sf-variants[^{]*\{([^}]*)}/g)]
  .map((m) => m[1])
  .join("\n");

describe("variant selector style contract", () => {
  it("paints every face through tokens", () => {
    for (const prop of [
      /color:\s*var\(--variants-label,\s*var\(--text-muted\)\)/,
      /color:\s*var\(--variants-text,\s*var\(--color-ink\)\)/,
      /background:\s*var\(--variants-bg,\s*var\(--color-navbar-bg\)\)/,
      /border:\s*1px solid var\(--variants-border,\s*var\(--border\)\)/,
      /background:\s*var\(--variants-active-bg,\s*var\(--color-accent-50\)\)/,
      /background:\s*var\(--variants-disabled-bg,\s*var\(--color-section-bg\)\)/,
    ]) {
      expect(variantsCss, `variant paint must resolve ${prop} through a var`).toMatch(prop);
    }
  });

  it("renders the three display faces from data-display", () => {
    expect(css).toMatch(/\.sf-variants__value\[data-display="pill"\]/);
    expect(css).toMatch(/\.sf-variants__value\[data-display="swatch"\]/);
  });

  it("marks the picked value and scopes hover off it and off unavailable", () => {
    expect(css).toMatch(/\.sf-variants__value\[data-active="true"\]/);
    expect(css).toMatch(
      /\.sf-variants__value:not\(\[data-active="true"\]\):not\(\[aria-disabled="true"\]\):hover/,
    );
  });

  it("keeps unavailable values solid — no opacity, no removal", () => {
    expect(css).toMatch(/\.sf-variants__value\[aria-disabled="true"\]\s*\{[^}]*cursor:\s*not-allowed/);
    expect(variantsCss).not.toMatch(/opacity/);
    // A dead swatch keeps the admin's colour and is lightened by a white wash
    // drawn in a ::after — a ring read as a spinner, and the `opacity` property
    // would fade the hue toward the page. Neither is used.
    expect(css).toMatch(
      /\.sf-variants__value\[data-display="swatch"\]\[aria-disabled="true"\]::after\s*\{[^}]*background:\s*var\(--variants-disabled-wash/,
    );
    expect(css).not.toMatch(/outline:\s*2px dashed/);
  });

  it("keeps a visible focus ring and no motion", () => {
    expect(css).toMatch(/\.sf-variants__value:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--color-accent/);
    expect(variantsCss).not.toMatch(/transition|animation/);
  });

  it("contains no hex literals outside var() fallbacks", () => {
    const withoutFallbacks = variantsCss.replace(/var\([^()]*\)/g, "");
    const hexes = withoutFallbacks.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
    expect(hexes, `hardcoded paint ${hexes.join(", ")} bypasses theming`).toEqual([]);
  });
});
