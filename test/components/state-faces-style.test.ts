import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const cssPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "app", "globals.css");
const rawCss = readFileSync(cssPath, "utf8");
const css = rawCss.replace(/\/\*[\s\S]*?\*\//g, "");
const faceCss = [...css.matchAll(/\.sf-state[^{]*\{([^}]*)}/g)].map((m) => m[1]).join("\n");

describe("shared state face style contract", () => {
  it("paints every face through --state-* vars with token fallbacks", () => {
    for (const prop of [
      /color:\s*var\(--state-text,\s*var\(--color-ink\)\)/,
      /font-size:\s*var\(--state-title-size,\s*var\(--fs-display-3\)\)/,
      /color:\s*var\(--state-body,\s*var\(--text-muted\)\)/,
      /border-top-color:\s*var\(--state-spinner-fill,\s*var\(--color-accent\)\)/,
    ]) {
      expect(faceCss, `state paint must resolve ${prop} through a var`).toMatch(prop);
    }
  });

  it("drives size only through data-size and kills spinner motion under reduced-motion", () => {
    expect(css).toMatch(/\.sf-state\[data-size="compact"\]/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.sf-state__spinner\s*\{\s*animation:\s*none/);
  });

  it("contains no opacity or raw hex outside var() fallbacks", () => {
    expect(faceCss).not.toMatch(/opacity/);
    const withoutFallbacks = faceCss.replace(/var\([^()]*\)/g, "");
    expect(withoutFallbacks.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).toEqual([]);
  });

  it("gives the degraded section a real compact layout", () => {
    expect(css).toMatch(/\.sf-degraded\s*\{[^}]*display:\s*grid/);
    expect(css).toMatch(/\.sf-degraded\s*\{[^}]*gap:\s*var\(--degraded-gap/);
  });
});
