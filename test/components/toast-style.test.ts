/**
 * Toast style contract — .sf-toast paints through tokens; bottom-center
 * geometry; fade arrival killed under reduced-motion; no literals outside
 * var() fallbacks.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const cssPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "app", "globals.css");
const rawCss = readFileSync(cssPath, "utf8");
const css = rawCss.replace(/\/\*[\s\S]*?\*\//g, "");

const toastCss = [...css.matchAll(/\.sf-toast[^{]*\{([^}]*)}/g)].map((m) => m[1]).join("\n");

describe("toast style contract", () => {
  it("pins bottom-center above overlays on tokens", () => {
    expect(toastCss).toMatch(/position:\s*fixed/);
    expect(toastCss).toMatch(/bottom:\s*24px/);
    expect(toastCss).toMatch(/z-index:\s*60/);
    expect(toastCss).toMatch(/background:\s*var\(--color-navbar-bg/);
    expect(toastCss).toMatch(/color:\s*var\(--color-ink/);
  });

  it("arrives with a var-free fade (tokens only) killed under reduced-motion", () => {
    expect(css).toMatch(/@keyframes sf-toast-in/);
    expect(css).toMatch(/\.sf-toast\s*\{[^}]*animation:\s*sf-toast-in 180ms ease-out/);
    const guard = css.match(/@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\n\}/g)?.join("\n") ?? "";
    expect(guard).toMatch(/\.sf-toast/);
  });

  it("contains no hex literals outside var() fallbacks", () => {
    const withoutFallbacks = toastCss.replace(/var\([^()]*\)/g, "");
    const hexes = withoutFallbacks.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
    expect(hexes, `hardcoded paint ${hexes.join(", ")} bypasses theming`).toEqual([]);
  });
});
