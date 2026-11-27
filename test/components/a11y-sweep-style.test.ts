/**
 * Final a11y/UX sweep style contract — sf-097.
 *
 * Two shipped classes of gap this file guards forever:
 *   1. Interactive controls painted on :hover but with no fixed focus-visible
 *      ring / hover parity, so keyboard users saw nothing (AGENTS §3.6).
 *   2. CSS transitions with no instant counterpart under prefers-reduced-motion
 *      (SKILL-MOTION rule 4) — the guard block silently omitted them.
 *
 * Paint stays in globals.css behind --sf-* tokens; no component hex is added.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const cssPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "app", "globals.css");
const css = readFileSync(cssPath, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

const guards =
  [...css.matchAll(/@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/g)]
    .map((m) => m[1])
    .join("\n");

function ruleBlock(selector: string): string {
  return ruleBlocks(selector)[0] ?? "";
}

/** Every rule keyed by this selector — a focus rule may be split from its
 *  paint-sharing sibling (e.g. a grouped hover/focus rule plus a ring rule). */
function ruleBlocks(selector: string): string[] {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return [...css.matchAll(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, "g"))].map((m) => m[1] ?? "");
}

const FIXED_RING = /outline:\s*2px solid var\(--color-accent\)/;
const RING_OFFSET = /outline-offset:\s*2px/;

describe("focus-visible parity for hover-painted controls", () => {
  it("gives every primary-nav link/trigger the ring and the hover wash on focus", () => {
    const wash = css.match(/\.sf-navlinks :is\(a, button\):not\(\[aria-disabled="true"\]\):focus-visible,[\s\S]*?\}/)?.[0] ?? "";
    expect(wash, "focus must show the same background/border/colour wash as hover").toMatch(
      /background:\s*var\(--sf-nav-hover-bg\)/,
    );
    expect(ruleBlock(".sf-navlinks :is(a, button):focus-visible")).toMatch(FIXED_RING);
    expect(ruleBlock(".sf-navlinks :is(a, button):focus-visible")).toMatch(RING_OFFSET);

    const sale = css.match(/\.sf-navlinks :is\(a, button\)\[data-highlight="sale"\]:focus-visible/);
    expect(sale, "sale wash must also show on keyboard focus").not.toBeNull();

    const underline = css.match(/\.sf-navlinks a:hover,\s*\.sf-navlinks a:focus-visible\s*\{([^}]*)\}/)?.[1] ?? "";
    expect(underline).toMatch(/text-decoration:\s*underline/);
  });

  it("gives the search-sheet Cancel button a gated hover and a focus ring", () => {
    expect(ruleBlock(".sf-searchsheet__cancel:not([disabled]):hover")).toMatch(/border-color:/);
    const block = ruleBlock(".sf-searchsheet__cancel:focus-visible");
    expect(block).toMatch(FIXED_RING);
    expect(block).toMatch(RING_OFFSET);
    // Focus mirrors the accent border/colour hover paint.
    expect(block).toMatch(/border-color:\s*var\(--color-accent\)/);
    expect(block).toMatch(/color:\s*var\(--color-accent\)/);
  });

  it("gives product-card image arrows a focus ring with the accent border", () => {
    const block = ruleBlock(".sf-productcard__img-arrow:focus-visible");
    expect(block).toMatch(FIXED_RING);
    expect(block).toMatch(RING_OFFSET);
    expect(block).toMatch(/border-color:\s*var\(--color-accent\)/);
    // Hover stays gated off disabled arrows.
    expect(css).toMatch(/\.sf-productcard__img-arrow:not\(\[disabled\]\):hover/);
  });

  it("gives search-palette Clear all and recent rows a ring plus hover parity", () => {
    for (const selector of [".sf-searchpalette__clear", ".sf-searchpalette__recentrow"]) {
      const blocks = ruleBlocks(`${selector}:focus-visible`);
      expect(blocks.some((block) => FIXED_RING.test(block)), `${selector} must carry the fixed ring`).toBe(true);
    }
    expect(css).toMatch(/\.sf-searchpalette__clear:not\(\[disabled\]\):hover,\s*\.sf-searchpalette__clear:focus-visible/);
    expect(css).toMatch(
      /\.sf-searchpalette__recentrow:not\(\[disabled\]\):hover,\s*\.sf-searchpalette__recentrow:focus-visible[\s\S]*?text-decoration:\s*underline/,
    );
  });
});

describe("reduced-motion guard covers every painted transition", () => {
  it("kills nav-link and icon-button transitions (they were outside every guard)", () => {
    expect(guards).toMatch(/\.sf-navlinks :is\(a, button\)[\s\S]*?transition:\s*none/);
    expect(guards).toMatch(/\.sf-iconbtn[\s\S]*?transition:\s*none/);
  });

  it("kills product-card arrow, swatch, pill and indicator transitions", () => {
    for (const selector of [
      ".sf-productcard__img-arrow",
      ".sf-productcard__swatch",
      ".sf-productcard__pill",
      ".sf-productcard__indicator-dot",
      ".sf-productcard__indicator-bar",
    ]) {
      const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      expect(guards, `${selector} transition must have an instant counterpart`).toMatch(
        new RegExp(`${escaped}[\\s\\S]*?transition:\\s*none`),
      );
    }
  });

  it("keeps the newly added focus rings intact (motion dies, indicator stays)", () => {
    // Reduced motion must not suppress the accessibility indicator itself.
    // Scope to this sweep's rings — the search input's underline is a
    // documented exception (its photo backdrop cannot take an extra ring).
    for (const selector of [
      ".sf-navlinks :is(a, button):focus-visible",
      ".sf-searchsheet__cancel:focus-visible",
      ".sf-productcard__img-arrow:focus-visible",
      ".sf-searchpalette__clear:focus-visible",
      ".sf-searchpalette__recentrow:focus-visible",
    ]) {
      expect(
        ruleBlocks(selector).some((block) => FIXED_RING.test(block)),
        `${selector} lost its fixed focus ring`,
      ).toBe(true);
    }
  });
});

describe("no paint regressions in this sweep", () => {
  it("introduces no bare :hover on the newly gated controls", () => {
    expect(css).not.toMatch(/\.sf-searchsheet__cancel:hover/);
    expect(css).not.toMatch(/\.sf-productcard__img-arrow:hover/);
    // Nav wash + underline hovers are paired with :focus-visible in their groups.
    expect(css).toMatch(
      /\.sf-navlinks :is\(a, button\):not\(\[aria-disabled="true"\]\):hover,\s*\.sf-navlinks :is\(a, button\):not\(\[aria-disabled="true"\]\):focus-visible/,
    );
    expect(css).toMatch(/\.sf-navlinks a:hover,\s*\.sf-navlinks a:focus-visible/);
  });

  it("keeps the fixed focus token defined once", () => {
    expect(css).toMatch(/--sf-state-focus-outline:\s*#0077B6\s*;/);
  });
});
