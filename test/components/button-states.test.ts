/**
 * Disabled/loading state contract — guards two shipped bugs forever.
 *
 * Bug 1 (unreadable): disabled used `opacity: 0.5`, fading text and face
 * together toward the page (≈1.5:1 contrast — label "same as background").
 * Contract: the disabled block sets explicit solid background + color and
 * contains no fractional opacity.
 *
 * Bug 2 (hover leak): `:hover` matches disabled elements in Chrome, and the
 * hover rules did not exclude them — worst case, the light variant swapped
 * to white text on a white face. Contract: EVERY .sf-btn hover selector
 * excludes [disabled] and [aria-disabled="true"] (links use aria-disabled).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const cssPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "app", "globals.css");
const rawCss = readFileSync(cssPath, "utf8");
const css = rawCss.replace(/\/\*[\s\S]*?\*\//g, "");

const DISABLED_GUARD = ":not([disabled]):not([aria-disabled])";
const SANS_WHITESPACE = (s: string) => s.replace(/\s+/g, "");

describe("disabled/loading state contract", () => {
  it("gates every hover rule off disabled buttons (unless explicitly opted in)", () => {
    // Collect each selector list that contains :hover on .sf-btn.
    const hoverSelectors = [...css.matchAll(/([^{}]*\.sf-btn[^{}]*?:hover[^{}]*?)\{/g)].map((m) =>
      SANS_WHITESPACE(m[1]),
    );
    expect(hoverSelectors.length).toBeGreaterThan(0);
    // A hover selector is safe iff it excludes disabled buttons, or it
    // requires the explicit admin opt-in (data-disabled-hover="on", which
    // Button only emits when disabled.hoverEnabled resolves true —
    // default false). A bare .sf-btn…:hover is the shipped bug.
    const unsafe = hoverSelectors.filter((sel) =>
      sel
        .split(",")
        .some(
          (part) =>
            part.includes(":hover") &&
            !part.includes(':not([disabled]):not([aria-disabled="true"])') &&
            !part.includes('[data-disabled-hover="on"]'),
        ),
    );
    expect(
      unsafe,
      `these hover selectors fire on disabled buttons by default (gate with ${DISABLED_GUARD} or [data-disabled-hover="on"]): ${unsafe.join(" | ")}`,
    ).toEqual([]);
  });

  it("gives disabled an explicit solid face (no opacity fade)", () => {
    const block = css.match(/\.sf-btn\[disabled\][^{]*\{([^}]*)}/)?.[1] ?? "";
    expect(block).toMatch(/background:/);
    expect(block).toMatch(/(^|;)\s*color:/);
    expect(block).toMatch(/border-color:/);
    expect(block).not.toMatch(/opacity:\s*0\./);
  });

  it("keeps the wave layer off disabled buttons", () => {
    const block = css.match(/\.sf-btn\[disabled\]::before[^{]*\{([^}]*)}/)?.[1] ?? "";
    expect(block).toMatch(/display:\s*none/);
  });

  it("gates the pressed effect off disabled buttons too", () => {
    const activeSelectors = [...css.matchAll(/([^{}]*\.sf-btn[^{}]*?:active[^{}]*?)\{/g)].map((m) =>
      SANS_WHITESPACE(m[1]),
    );
    expect(activeSelectors.length).toBeGreaterThan(0);
    for (const sel of activeSelectors) {
      expect(
        sel.includes(':not([disabled]):not([aria-disabled="true"])'),
        `pressed rule fires on disabled buttons: ${sel}`,
      ).toBe(true);
    }
  });
});
