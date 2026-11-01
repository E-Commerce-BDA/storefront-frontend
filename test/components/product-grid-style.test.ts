/**
 * ProductGrid style contract — .sf-grid keeps columns as vars, paints quick-add
 * state through tokens with explicit solids (never opacity), and adds no motion.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const cssPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "app", "globals.css");
const rawCss = readFileSync(cssPath, "utf8");
const css = rawCss.replace(/\/\*[\s\S]*?\*\//g, "");

const gridCss = [...css.matchAll(/\.sf-grid[^{]*\{([^}]*)}/g)].map((m) => m[1]).join("\n");

describe("product grid style contract", () => {
  it("takes every column count from an inline var with a fallback", () => {
    for (const breakpoint of ["phone", "tablet", "desktop"]) {
      expect(gridCss, `${breakpoint} columns must resolve through a var`).toMatch(
        new RegExp(`repeat\\(var\\(--grid-cols-${breakpoint},\\s*\\d+\\)`),
      );
    }
  });

  it("steps the breakpoints up, mobile-first", () => {
    expect(css).toMatch(/@media \(min-width: 640px\)[\s\S]*?\.sf-grid[\s\S]*?--grid-cols-tablet/);
    expect(css).toMatch(/@media \(min-width: 1024px\)[\s\S]*?\.sf-grid[\s\S]*?--grid-cols-desktop/);
  });

  it("paints the quick-add state through token-backed vars on the cell", () => {
    for (const prop of [
      /\.sf-grid__cell\[data-pending="true"\]::after\s*\{[^}]*border-color:\s*var\(--grid-pending-border,\s*var\(--border\)\)/,
      /\.sf-grid__cell\[data-added="true"\]::after\s*\{[^}]*border-color:\s*var\(--grid-added-border,\s*var\(--color-success\)\)/,
    ]) {
      expect(css, `quick-add paint must resolve through ${prop}`).toMatch(prop);
    }
  });

  it("dims with explicit solids, never opacity, and never steals clicks", () => {
    expect(gridCss).not.toMatch(/opacity:/);
    expect(css).toMatch(/\.sf-grid__cell::after\s*\{[^}]*pointer-events:\s*none/);
  });

  it("keeps no motion in the grid", () => {
    expect(gridCss).not.toMatch(/transition|animation/);
  });

  it("contains no hex literals outside var() fallbacks", () => {
    const withoutFallbacks = gridCss.replace(/var\([^()]*\)/g, "");
    const hexes = withoutFallbacks.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
    expect(hexes, `hardcoded paint ${hexes.join(", ")} bypasses theming`).toEqual([]);
  });
});
