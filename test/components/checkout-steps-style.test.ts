import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const cssPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "app", "globals.css");
const css = readFileSync(cssPath, "latin1").replace(/\/\*[\s\S]*?\*\//g, "");
const stepsCss = [...css.matchAll(/\.sf-checkoutsteps[^{]*\{([^}]*)}/g)]
  .map((m) => m[1])
  .join("\n");

describe("checkout steps style contract (sf-058)", () => {
  it("paints through vars", () => {
    expect(stepsCss).toMatch(/color:\s*var\(--color-ink\)/);
    expect(stepsCss).toMatch(/border:\s*1px solid var\(--border\)/);
    expect(stepsCss).toMatch(/border-radius:\s*var\(--radius-sm/);
  });

  it("drives every state through data-state and keeps a focus ring", () => {
    expect(css).toMatch(/\.sf-checkoutsteps__step\[data-state="active"\]/);
    expect(css).toMatch(/\.sf-checkoutsteps__step\[data-state="done"\]/);
    expect(css).toMatch(/\.sf-checkoutsteps__step:focus-within\s*\{[^}]*outline:\s*2px solid var\(--color-accent/);
  });

  it("contains no hex literals outside var() fallbacks", () => {
    const withoutFallbacks = stepsCss.replace(/var\([^()]*\)/g, "");
    const hexes = withoutFallbacks.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
    expect(hexes, `hardcoded paint ${hexes.join(", ")} bypasses theming`).toEqual([]);
  });
});
