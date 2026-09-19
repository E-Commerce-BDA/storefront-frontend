/**
 * Tooltip style contract — every visual knob resolves through a CSS var.
 *
 * Guards the customization model: hardcoded values may only appear as
 * var() fallbacks (today's look), never as the primary value. A knob
 * painted directly in CSS bypasses admin overrides and fails here.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const cssPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "app", "globals.css");
const rawCss = readFileSync(cssPath, "utf8");
const css = rawCss.replace(/\/\*[\s\S]*?\*\//g, "");

const bubbleBlock = () => {
  const blocks = [...css.matchAll(/\.sf-tip__bubble\s*\{([^}]*)}/g)].map((m) => m[1]);
  // First match lives in the reduced-motion guard; the paint rule carries position.
  return blocks.find((b) => /position:\s*absolute/.test(b)) ?? "";
};

describe("tooltip style contract", () => {
  it("paints the bubble through vars (fallbacks preserve today)", () => {
    const block = bubbleBlock();
    for (const prop of [
      /background:\s*var\(--tip-bg/,
      /color:\s*var\(--tip-text/,
      /border:\s*var\(--tip-border-width/,
      /border-radius:\s*var\(--tip-radius/,
      /font-size:\s*var\(--tip-font-size/,
      /font-weight:\s*var\(--tip-font-weight/,
    ]) {
      expect(block, `bubble must resolve ${prop} through a var`).toMatch(prop);
    }
  });

  it("drives offset and duration through vars", () => {
    expect(css).toMatch(/calc\(100% \+ var\(--tip-offset/);
    expect(css).toMatch(/var\(--tip-duration/);
  });

  it("supports fade/slide/none animation modes", () => {
    expect(css).toMatch(/\[data-tip-anim="slide"\]/);
    expect(css).toMatch(/\[data-tip-anim="none"\][^{]*\{\s*transition:\s*none/);
    // fade = base visible transform (no drift rule): only slide carries
    // rest-offset transforms.
    const driftRules = css.match(/\[data-tip-anim="slide"\][^{}]*\{[^}]*transform:/g) ?? [];
    expect(driftRules.length).toBeGreaterThan(0);
    const fadeDrift = css.match(/\[data-tip-anim="fade"\][^{}]*\{[^}]*transform:/g) ?? [];
    expect(fadeDrift).toEqual([]);
  });

  it("keeps the arrow nub on the bubble background var", () => {
    expect(css).toMatch(/\.sf-tip__bubble\[data-arrow="on"\]::after[^{]*\{[^}]*background:\s*var\(--tip-bg/);
  });
});
