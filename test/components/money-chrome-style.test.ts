import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const cssPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "app", "globals.css");
const css = readFileSync(cssPath, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
const block = css.slice(css.indexOf(".sf-cart__summary,"), css.indexOf(".sf-confirmation__timeline"));

describe("money chrome style contract (sf-093)", () => {
  it("paints every surface through vars and data hooks", () => {
    expect(block).toMatch(/gap:\s*var\(--money-stack-gap/);
    expect(block).toMatch(/border:\s*1px solid var\(--border\)/);
    expect(block).toMatch(/\.sf-payment-pill\[data-selected="true"\]/);
    expect(block).toMatch(/\.sf-payment-pill\[aria-disabled="true"\]/);
  });

  it("keeps disabled faces solid — no opacity, no hex outside fallbacks", () => {
    const withoutFallbacks = block.replace(/var\([^()]*\)/g, "");
    expect(withoutFallbacks.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).toEqual([]);
    expect(block).not.toMatch(/opacity/);
  });
});
