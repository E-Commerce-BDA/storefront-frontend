import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const cssPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "app", "globals.css");
const css = readFileSync(cssPath, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
const guards = css.match(/@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\n\}/g)?.join("\n") ?? "";

const drawerPaint = [...css.matchAll(/\.sf-drawer[^{]*\{([^}]*)}/g)].map((m) => m[1]).join("\n");
const toastPaint = [...css.matchAll(/\.sf-toast-wrap[^{]*\{([^}]*)}/g)].map((m) => m[1]).join("\n");

describe("overlay surfaces style contract (sf-090)", () => {
  it("shares one scrim and one drawer contract driven by data attrs", () => {
    expect(css).toMatch(/\.sf-scrim\s*\{[^}]*background:\s*var\(--scrim/);
    expect(css).toMatch(/\.sf-drawer\s*\{[^}]*background:\s*var\(--drawer-bg/);
    expect(css).toMatch(/\.sf-drawer\[data-side="left"\]/);
    expect(css).toMatch(/\.sf-drawer\[data-side="right"\]/);
    expect(css).toMatch(/\.sf-drawer\[data-open="true"\]/);
    expect(css).toMatch(/\.sf-drawer\[data-motion="on"\]/);
    expect(drawerPaint).toMatch(/translateX\(calc\(-100% - 8px\)\)/);
    expect(drawerPaint).toMatch(/translateX\(calc\(100% \+ 8px\)\)/);
  });

  it("kills drawer and stacked-toast motion under reduced motion", () => {
    expect(guards).toMatch(/\.sf-drawer\[data-motion="on"\]/);
    expect(guards).toMatch(/\.sf-toast-wrap \.sf-toast/);
  });

  it("stacks toasts bottom-right with squarish radii and locked tokens", () => {
    expect(css).toMatch(/\.sf-toast-wrap\s*\{[^}]*position:\s*fixed/);
    expect(css).toMatch(/\.sf-toast-wrap\s*\{[^}]*flex-direction:\s*column/);
    expect(css).toMatch(/\.sf-toast-wrap \.sf-toast\s*\{[^}]*border-radius:\s*var\(--sf-radius-button/);
    expect(css).toMatch(/--sf-toast-z:/);
    expect(toastPaint).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  it("keeps the footer dark and oceanic through the locked tokens", () => {
    expect(css).toMatch(/--footer-bg:\s*var\(--sf-color-footer-bg\)/);
    expect(css).toMatch(/\.sf-footer\s*\{[^}]*background:\s*var\(--footer-bg/);
    expect(css).toMatch(/\.sf-footer a:focus-visible\s*\{[^}]*border-radius:\s*var\(--sf-radius-sm/);
    expect(css).toMatch(/--sf-color-footer-bg:\s*#0a2540/i);
  });

  it("paints the compare tray on a squarish radius and data hooks", () => {
    expect(css).toMatch(/--compare-radius:\s*var\(--sf-radius-button\)/);
    expect(css).toMatch(/\.sf-compare-tray__go\[data-disabled="true"\]/);
    expect(css).toMatch(/\.sf-compare-tray\s*\{[^}]*border-radius:\s*var\(--compare-radius/);
  });

  it("has no hex literals outside var() fallbacks in the new contract", () => {
    const withoutFallbacks = (drawerPaint + toastPaint).replace(/var\([^()]*\)/g, "");
    expect(withoutFallbacks.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).toEqual([]);
  });
});
