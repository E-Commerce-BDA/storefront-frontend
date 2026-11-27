import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const cssPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "app", "globals.css");
const css = readFileSync(cssPath, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

function rulesFor(prefix: string): string {
  return [...css.matchAll(new RegExp(`\\.${prefix}[^{]*\\{([^}]*)}`, "g"))]
    .map((match) => match[1])
    .join("\n");
}

const paint = [
  rulesFor("sf-segmented"),
  rulesFor("sf-menu"),
  rulesFor("sf-filter-drawer"),
  rulesFor("sf-shop-toolbar"),
].join("\n");

describe("foundational style contract (sf-087)", () => {
  it("paints each primitive only through vars and tokens", () => {
    for (const pattern of [
      /background:\s*var\(--segmented-bg/,
      /background:\s*var\(--segmented-selected-bg/,
      /background:\s*var\(--menu-bg/,
      /background:\s*var\(--drawer-bg/,
      /background:\s*var\(--scrim/,
      /color:\s*var\(--toolbar-count/,
    ]) {
      expect(paint, `paint must resolve ${pattern} through a var`).toMatch(pattern);
    }
  });

  it("drives every state from a data hook", () => {
    expect(css).toMatch(/\.sf-segmented\[data-size="sm"\]/);
    expect(css).toMatch(/\.sf-segmented__btn\[data-selected="true"\]/);
    expect(css).toMatch(/\.sf-menu\[data-open="true"\]/);
    expect(css).toMatch(/\.sf-menu\[data-align="end"\]/);
    expect(css).toMatch(/\.sf-filter-drawer\[data-side="right"\]/);
  });

  it("gates hover off selected and disabled faces and keeps a focus ring", () => {
    expect(css).toMatch(/\.sf-segmented__btn:not\(\[data-selected="true"\]\):not\(\[disabled\]\):hover/);
    expect(css).toMatch(/\.sf-segmented__btn:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--color-accent/);
    expect(css).toMatch(/\.sf-segmented__btn\[disabled\]\s*\{[^}]*background:\s*var\(--surface-disabled\)/);
    expect(paint).not.toMatch(/opacity/);
  });

  it("times motion through vars and kills it under reduced motion", () => {
    expect(css).toMatch(/transition:\s*background var\(--segmented-duration/);
    expect(css).toMatch(/transition:\s*transform var\(--menu-duration/);
    const guards = [
      ...css.matchAll(/@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\}/g),
    ].map((match) => match[1]);
    expect(guards.some((guard) => guard.includes(".sf-segmented__btn"))).toBe(true);
    expect(guards.some((guard) => guard.includes(".sf-menu__panel"))).toBe(true);
  });

  it("contains no hex literals outside var() fallbacks", () => {
    const withoutFallbacks = paint.replace(/var\([^()]*\)/g, "");
    expect(withoutFallbacks.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).toEqual([]);
  });
});
