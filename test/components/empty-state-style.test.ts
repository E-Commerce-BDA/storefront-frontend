/**
 * EmptyState style contract — .sf-empty resolves glyph wash, title and body
 * through --empty-* vars over tokens, and paints nothing from literals.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const cssPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "app", "globals.css");
const rawCss = readFileSync(cssPath, "utf8");
const css = rawCss.replace(/\/\*[\s\S]*?\*\//g, "");

const emptyCss = [...css.matchAll(/\.sf-empty[^{]*\{([^}]*)}/g)].map((m) => m[1]).join("\n");

describe("empty state style contract", () => {
  it("paints the glyph wash, title and body through --empty-* vars", () => {
    for (const prop of [
      /background:\s*var\(--empty-glyph-bg,\s*var\(--color-accent-50\)\)/,
      /color:\s*var\(--empty-glyph-text,\s*var\(--color-accent\)\)/,
      /color:\s*var\(--empty-title,\s*var\(--color-ink\)\)/,
      /color:\s*var\(--empty-body,\s*var\(--text-muted\)\)/,
    ]) {
      expect(emptyCss, `empty-state paint must resolve ${prop} through a var`).toMatch(prop);
    }
  });

  it("keeps the glyph at the documented 44px and the body line-length readable", () => {
    expect(emptyCss).toMatch(/width:\s*44px/);
    expect(emptyCss).toMatch(/height:\s*44px/);
    expect(emptyCss).toMatch(/max-width:\s*46ch/);
  });

  it("contains no hex literals outside var() fallbacks", () => {
    const withoutFallbacks = emptyCss.replace(/var\([^()]*\)/g, "");
    const hexes = withoutFallbacks.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
    expect(hexes, `hardcoded paint ${hexes.join(", ")} bypasses theming`).toEqual([]);
  });

  it("holds no state hooks — the block is a fixed face", () => {
    expect(css).not.toMatch(/\.sf-empty\[data-/);
  });
});
