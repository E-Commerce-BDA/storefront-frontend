import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const cssPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "app", "globals.css");
const css = readFileSync(cssPath, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
const block = css.slice(css.indexOf(".sf-account-tabs {"), css.indexOf(".sf-compare[data-differences-only"));

describe("account/compare style contract (sf-094)", () => {
  it("keeps spacing and emphasis in vars and marks the differences face", () => {
    expect(block).toMatch(/gap:\s*var\(--account-tab-gap/);
    expect(block).toMatch(/gap:\s*var\(--compare-view-gap/);
    expect(css).toMatch(/\.sf-compare\[data-differences-only="true"\]/);
  });

  it("contains no hex outside var() fallbacks and no opacity", () => {
    const withoutFallbacks = block.replace(/var\([^()]*\)/g, "");
    expect(withoutFallbacks.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).toEqual([]);
    expect(block).not.toMatch(/opacity/);
  });
});
