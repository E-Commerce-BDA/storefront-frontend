/**
 * Auth style contract — every paint value in .sf-auth* resolves through an
 * --auth-* var (fallbacks mirror DEFAULT_AUTH_SETTINGS) or a status token.
 * A knob painted as a literal bypasses admin overrides and fails here.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const cssPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "app", "globals.css");
const rawCss = readFileSync(cssPath, "utf8");
const css = rawCss.replace(/\/\*[\s\S]*?\*\//g, "");

const authCss = [...css.matchAll(/\.sf-auth[^{]*\{([^}]*)}/g)].map((m) => m[1]).join("\n");

describe("auth style contract", () => {
  it("paints card/panel/type through --auth-* vars", () => {
    for (const prop of [
      /background:\s*var\(--auth-form-bg/,
      /border-radius:\s*var\(--auth-form-radius/,
      /background:\s*var\(--auth-panel-bg/,
      /font-size:\s*var\(--auth-headline-size/,
      /font-size:\s*var\(--auth-form-title-size/,
      /opacity:\s*var\(--auth-panel-overlay-opacity/,
      /animation:[^;]*var\(--auth-page-fade/,
    ]) {
      expect(authCss, `auth paint must resolve ${prop} through a var`).toMatch(prop);
    }
  });

  it("drives split geometry through data hooks, not classes", () => {
    expect(css).toMatch(/\.sf-auth__split\[data-ratio="60-40"\]/);
    expect(css).toMatch(/\.sf-auth__split\[data-side="right"\]/);
    expect(css).toMatch(/\.sf-auth__split\[data-mobile="stacked"\]/);
  });

  it("contains no hex literals outside var() fallbacks (fallbacks mirror the resolver per AGENTS.md §3.4)", () => {
    const withoutFallbacks = authCss.replace(/var\([^()]*\)/g, "");
    const hexes = withoutFallbacks.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
    expect(hexes, `hardcoded paint ${hexes.join(", ")} bypasses theming`).toEqual([]);
  });

  it("dead auth motion respects reduced-motion", () => {
    expect(css).toMatch(/prefers-reduced-motion/);
  });
});
