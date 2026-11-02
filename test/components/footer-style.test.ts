/**
 * Footer style contract — sf-062
 *
 * `.sf-footer*` resolves every fill through a `--footer-*` var with a token
 * fallback, drives its two faces through `data-face`, and shares the single
 * page-shell gutter with the navbar and the (shop) pages. A raw hex here would
 * mean the CMS theme could not repaint the footer, which is the whole reason the
 * footer is a CMS document.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const cssPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "app", "globals.css");
const rawCss = readFileSync(cssPath, "utf8");
const css = rawCss.replace(/\/\*[\s\S]*?\*\//g, "");

const footerCss = [...css.matchAll(/\.sf-footer[^{]*\{([^}]*)}/g)].map((m) => m[1]).join("\n");

describe("footer style contract", () => {
  it("exists at all — the block is styled, not scaffolded", () => {
    expect(footerCss.trim().length).toBeGreaterThan(0);
  });

  it("paints only through --footer-* vars and Oceanic tokens", () => {
    for (const prop of [
      /background:\s*var\(--footer-bg/,
      /color:\s*var\(--footer-text/,
      /color:\s*var\(--footer-link\b/,
      /color:\s*var\(--footer-link-hover/,
      /color:\s*var\(--footer-col-title/,
      /color:\s*var\(--footer-copyright/,
      /border-top:\s*1px solid var\(--footer-legal-border/,
    ]) {
      expect(footerCss, `footer paint must resolve ${prop} through a var`).toMatch(prop);
    }
  });

  it("shares one gutter with the navbar and the page shell", () => {
    expect(css).toMatch(/\.sf-footer\s*\{[^}]*var\(--sf-page-pad\)/);
    expect(css).toMatch(/\.sf-navbar\s*\{[^}]*var\(--sf-page-pad\)/);
    expect(css).toMatch(/\.sf-shop\s*\{[^}]*var\(--sf-page-pad\)/);
  });

  it("puts the measure on the inner container, never on the page", () => {
    // design-system §4: full-bleed shell; a capped *text* measure inside a
    // component is allowed, a capped page/section is not.
    expect(css).toMatch(/\.sf-footer__inner\s*\{[^}]*max-width:\s*var\(--footer-measure/);
    expect(css).toMatch(/\.sf-footer\s*\{[^}]*padding:\s*var\(--footer-pad-block[^}]*\n\}/);
    expect(footerCss).not.toMatch(/\.sf-footer\s*\{[^}]*max-width/);
  });

  it("drives both faces and social through data hooks", () => {
    expect(css).toMatch(/\.sf-footer--minimal/);
    expect(css).toMatch(/\.sf-footer__pay/);
    expect(rawCss).toMatch(/data-face="minimal"/);
  });

  it("keeps a focus ring on every footer link", () => {
    expect(css).toMatch(
      /\.sf-footer a:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--footer-focus/,
    );
  });

  it("wraps columns instead of assuming a count the admin chose", () => {
    expect(css).toMatch(
      /\.sf-footer__columns\s*\{[^}]*repeat\(auto-fit,\s*minmax\(var\(--footer-col-min/,
    );
  });

  it("contains no raw hex paint outside var() fallbacks", () => {
    // Mirrors the navbar contract: `var(--x, #hex)` is a documented fallback, a
    // bare `#hex` in a declaration is a theme bypass. Scrims/borders may use
    // rgba only inside such a fallback.
    const withoutFallbacks = footerCss.replace(/var\([^()]*\)/g, "");
    const hexes = withoutFallbacks.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
    expect(hexes, `hardcoded paint ${hexes.join(", ")} bypasses theming`).toEqual([]);
  });
});
