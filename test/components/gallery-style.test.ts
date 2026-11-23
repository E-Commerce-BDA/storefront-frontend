import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const cssPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "app", "globals.css");
const rawCss = readFileSync(cssPath, "utf8");
const css = rawCss.replace(/\/\*[\s\S]*?\*\//g, "");

const galleryCss = [...css.matchAll(/\.sf-gallery[^{]*\{([^}]*)}/g)].map((m) => m[1]).join("\n");

describe("gallery style contract", () => {
  it("takes the frame ratio from the inline var the block sets", () => {
    expect(galleryCss).toMatch(/aspect-ratio:\s*var\(--gallery-ratio,/);
  });

  it("paints the frame and rail through tokens", () => {
    for (const prop of [
      /background:\s*var\(--gallery-bg,\s*var\(--color-image-bg\)\)/,
      /border-radius:\s*var\(--gallery-radius,\s*var\(--radius-card\)\)/,
      /border:\s*1px solid var\(--gallery-thumb-border,\s*var\(--border\)\)/,
      /border-color:\s*var\(--gallery-thumb-active,\s*var\(--color-accent\)\)/,
    ]) {
      expect(galleryCss, `gallery paint must resolve ${prop} through a var`).toMatch(prop);
    }
  });

  it("drives the active thumb through a data hook and keeps hover off it", () => {
    expect(css).toMatch(/\.sf-gallery__thumb\[data-active="true"\]/);
    expect(css).toMatch(/\.sf-gallery__thumb:not\(\[data-active="true"\]\):hover/);
  });

  it("letterboxes only when the caller asks for it", () => {
    expect(css).toMatch(/\.sf-gallery\[data-fit="contain"\]\s+\.sf-gallery__img\s*\{[^}]*object-fit:\s*contain/);
    expect(galleryCss).toMatch(/object-fit:\s*cover/);
  });

  it("keeps a visible focus ring and no motion", () => {
    expect(css).toMatch(/\.sf-gallery__thumb:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--color-accent/);
    expect(galleryCss).not.toMatch(/transition|animation/);
  });

  it("contains no hex literals outside var() fallbacks", () => {
    const withoutFallbacks = galleryCss.replace(/var\([^()]*\)/g, "");
    const hexes = withoutFallbacks.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
    expect(hexes, `hardcoded paint ${hexes.join(", ")} bypasses theming`).toEqual([]);
  });
});
