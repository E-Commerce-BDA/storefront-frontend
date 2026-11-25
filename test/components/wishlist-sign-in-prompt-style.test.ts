import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const cssPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "app", "globals.css");
const css = readFileSync(cssPath, "latin1").replace(/\/\*[\s\S]*?\*\//g, "");
const promptCss = [...css.matchAll(/\.sf-wishlist-prompt[^{]*\{([^}]*)}/g)]
  .map((m) => m[1])
  .join("\n");

describe("wishlist prompt style contract (sf-056)", () => {
  it("paints through vars, not literals", () => {
    expect(promptCss).toMatch(/background:\s*var\(--scrim/);
    expect(promptCss).toMatch(/background:\s*var\(--surface-raised/);
    expect(promptCss).toMatch(/color:\s*var\(--color-ink\)/);
    expect(promptCss).toMatch(/border-radius:\s*var\(--radius-md/);
  });

  it("keeps a focus ring and kills motion under reduced-motion", () => {
    expect(css).toMatch(/\.sf-wishlist-prompt__signin:focus-visible,[\s\S]*?\{\s*outline:\s*2px solid var\(--color-accent/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.sf-wishlist-prompt__panel\s*\{\s*animation:\s*none/);
  });

  it("contains no hex literals outside var() fallbacks", () => {
    const withoutFallbacks = promptCss.replace(/var\([^()]*\)/g, "");
    const hexes = withoutFallbacks.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
    expect(hexes, `hardcoded paint ${hexes.join(", ")} bypasses theming`).toEqual([]);
  });
});
