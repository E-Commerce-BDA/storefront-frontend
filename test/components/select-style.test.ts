/**
 * Select style contract — wrap/arrow/popup paint through --se-* vars and
 * tokens; state via data hooks; subtle keyframed arrival killed under
 * reduced-motion; no literals outside var() fallbacks.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const cssPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "app", "globals.css");
const rawCss = readFileSync(cssPath, "utf8");
const css = rawCss.replace(/\/\*[\s\S]*?\*\//g, "");

const selCss = [...css.matchAll(/\.sf-select[^{]*\{([^}]*)}/g)].map((m) => m[1]).join("\n");

describe("select style contract", () => {
  it("paints popup faces through --se-* vars and tokens", () => {
    for (const prop of [
      /background:\s*var\(--se-selected-bg/,
      /color:\s*var\(--se-selected-text/,
      /background:\s*var\(--se-hover-bg/,
      /padding:\s*var\(--se-opt-pad-y/,
    ]) {
      expect(selCss, `select paint must resolve ${prop} through a var`).toMatch(prop);
    }
  });

  it("keeps the arrow decorative (never intercepts clicks)", () => {
    expect(css).toMatch(/\.sf-select__arrow\s*\{[^}]*pointer-events:\s*none/);
    expect(css).toMatch(/\.sf-selectwrap\s*\{[^}]*position:\s*relative/);
  });

  it("drives active + selected options through data hooks", () => {
    expect(css).toMatch(/\.sf-select__option\[data-active="true"\]/);
    expect(css).toMatch(/\.sf-select__option\[data-selected="true"\]/);
    expect(css).toMatch(/\.sf-select\[data-focus="custom"\]:focus/);
  });

  it("arrives with var-driven fade + 4px rise (never a panel slide)", () => {
    expect(css).toMatch(/@keyframes sf-select-in/);
    const frames = css.match(/@keyframes sf-select-in\s*\{[\s\S]*?\n\}/)?.[0] ?? "";
    expect(frames).toMatch(/opacity/);
    expect(frames).toMatch(/translateY\(4px\)/);
    expect(css).toMatch(/\.sf-select__list\[data-motion="on"\]\s*\{[^}]*animation:\s*sf-select-in var\(--se-list-duration/);
    expect(css).toMatch(/\.sf-select__list\[data-motion="off"\]\s*\{[^}]*animation:\s*none/);
  });

  it("kills popup motion under reduced-motion", () => {
    const guard = css.match(/@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\n\}/g)?.join("\n") ?? "";
    expect(guard).toMatch(/\.sf-select__list/);
  });

  it("contains no hex literals outside var() fallbacks", () => {
    const withoutFallbacks = selCss.replace(/var\([^()]*\)/g, "");
    const hexes = withoutFallbacks.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
    expect(hexes, `hardcoded paint ${hexes.join(", ")} bypasses theming`).toEqual([]);
  });
});
