import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const cssPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "app", "globals.css");
const css = readFileSync(cssPath, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
const block = (css.match(/\.sf-pdp-tabs[^{]*\{([^}]*)\}/g) ?? []).join("\n");

describe("PDP tab style contract (sf-092)", () => {
  it("paints through vars and hides panels with the native attribute", () => {
    expect(block).toMatch(/gap:\s*var\(--pdp-tabs-gap/);
    expect(block).toMatch(/background:\s*var\(--surface/);
    expect(css).toMatch(/\.sf-pdp-tabs__panel\[hidden\]/);
  });

  it("contains no hex outside var() fallbacks and no opacity", () => {
    const withoutFallbacks = block.replace(/var\([^()]*\)/g, "");
    expect(withoutFallbacks.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).toEqual([]);
    expect(block).not.toMatch(/opacity/);
  });
});
