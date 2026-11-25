import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const cssPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "app", "globals.css");
const rawCss = readFileSync(cssPath, "latin1");
const css = rawCss.replace(/\/\*[\s\S]*?\*\//g, "");

const menuCss = [...css.matchAll(/\.sf-accountmenu[^{]*\{([^}]*)}/g)]
  .map((m) => m[1])
  .join("\n");

describe("account menu style contract (sf-072)", () => {
  it("paints background, text and radius through vars", () => {
    expect(menuCss).toMatch(/background:\s*var\(--surface-raised/);
    expect(menuCss).toMatch(/color:\s*var\(--color-ink\)/);
    expect(menuCss).toMatch(/border-radius:\s*var\(--radius-md/);
  });

  it("gates hover off disabled and keeps a focus ring", () => {
    expect(css).toMatch(/\.sf-accountmenu__signout:not\(\[disabled\]\):hover/);
    expect(css).toMatch(/\.sf-accountmenu__signout:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--color-accent/);
  });

  it("uses a data hook for state and kills motion under reduced-motion", () => {
    expect(css).toMatch(/\.sf-accountmenu\[hidden\]/);
    expect(css).toMatch(/\.sf-accountmenu\[data-open="false"\]/s);
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.sf-accountmenu,\s*\[data-open\] \.sf-accountmenu\s*\{\s*animation:\s*none/,
    );
  });

  it("contains no hex literals outside var() fallbacks", () => {
    const withoutFallbacks = menuCss.replace(/var\([^()]*\)/g, "");
    const hexes = withoutFallbacks.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
    expect(hexes, `hardcoded paint ${hexes.join(", ")} bypasses theming`).toEqual([]);
  });
});
