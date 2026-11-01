/**
 * QuantityStepper style contract — .sf-qty paints through --qty-* vars over
 * tokens; state via data-disabled/data-pending; disabled faces are explicit
 * solids (never opacity); no motion, so there is nothing to kill under
 * reduced-motion.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const cssPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "app", "globals.css");
const rawCss = readFileSync(cssPath, "utf8");
const css = rawCss.replace(/\/\*[\s\S]*?\*\//g, "");

const qtyCss = [...css.matchAll(/\.sf-qty[^{]*\{([^}]*)}/g)].map((m) => m[1]).join("\n");

describe("quantity stepper style contract", () => {
  it("paints every face through --qty-* vars whose fallbacks are tokens", () => {
    for (const prop of [
      /background:\s*var\(--qty-bg,\s*var\(--color-navbar-bg\)\)/,
      /border:\s*1px solid var\(--qty-border,\s*var\(--border\)\)/,
      /color:\s*var\(--qty-text,\s*var\(--color-ink\)\)/,
      /background:\s*var\(--qty-hover-bg,\s*var\(--color-accent-50\)\)/,
      /background:\s*var\(--qty-disabled-bg,\s*var\(--color-section-bg\)\)/,
      /color:\s*var\(--qty-disabled-text,\s*var\(--text-muted\)\)/,
    ]) {
      expect(qtyCss, `stepper paint must resolve ${prop} through a var`).toMatch(prop);
    }
  });

  it("drives disabled + pending through data hooks", () => {
    expect(css).toMatch(/\.sf-qty\[data-disabled="true"\]\s*\{/);
    expect(css).toMatch(/\.sf-qty\[data-pending="true"\]\s+\.sf-qty__input/);
  });

  it("scopes hover off disabled buttons and hover-off the disabled row", () => {
    expect(css).toMatch(/\.sf-qty__btn:not\(\[disabled\]\):hover/);
    expect(css).toMatch(/\.sf-qty:not\(\[data-disabled="true"\]\):hover/);
  });

  it("shows focus the same way it shows hover, ring included", () => {
    expect(css).toMatch(/\.sf-qty:focus-within/);
    expect(css).toMatch(/\.sf-qty__btn:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--color-accent/);
    expect(css).toMatch(/\.sf-qty__input:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--color-accent/);
  });

  it("keeps disabled faces solid and motionless", () => {
    // opacity would destroy contrast (AGENTS §5 hard-ban), and an instant
    // stepper leaves nothing for reduced-motion to switch off.
    expect(qtyCss).not.toMatch(/opacity/);
    expect(qtyCss).not.toMatch(/transition|animation/);
    expect(css).toMatch(/\.sf-qty__btn\[disabled\]\s*\{[^}]*cursor:\s*not-allowed/);
  });

  it("contains no hex literals outside var() fallbacks", () => {
    const withoutFallbacks = qtyCss.replace(/var\([^()]*\)/g, "");
    const hexes = withoutFallbacks.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
    expect(hexes, `hardcoded paint ${hexes.join(", ")} bypasses theming`).toEqual([]);
  });
});
