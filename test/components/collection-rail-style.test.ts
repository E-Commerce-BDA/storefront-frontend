import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const cssPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "app", "globals.css");
const css = readFileSync(cssPath, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
const block = (css.match(/\.sf-collection__rail[^{]*\{([^}]*)\}/g) ?? []).join("\n");

describe("collection rail style contract (sf-091)", () => {
  it("supplies the cell width through a var, never a second paint vocabulary", () => {
    expect(block).toMatch(/--rail-cell-width:\s*var\(--collection-rail-cell-width/);
    expect(block).toMatch(/padding-bottom:\s*var\(--rail-track-pad/);
  });

  it("keys the face from data-layout", () => {
    expect(css).toMatch(/\.sf-collection__rail\[data-layout="carousel"\]/);
  });

  it("contains no hex outside var() fallbacks and no opacity", () => {
    const withoutFallbacks = block.replace(/var\([^()]*\)/g, "");
    expect(withoutFallbacks.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).toEqual([]);
    expect(block).not.toMatch(/opacity/);
  });
});
