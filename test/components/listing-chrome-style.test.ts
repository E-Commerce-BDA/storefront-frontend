import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const cssPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "app", "globals.css");
const css = readFileSync(cssPath, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
const desktop = css.slice(css.indexOf("@media (min-width: 1024px)"));

describe("listing chrome style contract (sf-092)", () => {
  it("puts the rail width and gap in vars", () => {
    expect(css).toMatch(/gap:\s*var\(--listing-gap/);
    expect(css).toMatch(/grid-template-columns:\s*var\(--listing-rail-width/);
  });

  it("hides the mobile filter trigger and grid switch on desktop", () => {
    expect(desktop).toMatch(/\.sf-shop-toolbar__filter/);
    expect(desktop).toMatch(/\.sf-gridmode/);
    expect(desktop).toMatch(/display:\s*none/);
  });

  it("contains no hex outside var() fallbacks and no opacity in the shell", () => {
    const block = css.slice(css.indexOf(".sf-listing {"), css.indexOf(".sf-filter-drawer {"));
    const withoutFallbacks = block.replace(/var\([^()]*\)/g, "");
    expect(withoutFallbacks.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).toEqual([]);
    expect(block).not.toMatch(/opacity/);
  });
});
