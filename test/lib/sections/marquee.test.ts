/**
 * Marquee arithmetic — sf-060.
 *
 * The CMS stores a speed in px/s and CSS needs seconds, so this conversion is
 * the only thing that makes a marquee's speed honest. The parity half matters as
 * much as the maths: the cell width is a *stylesheet* number, and a duration
 * computed from a stale constant would silently change the strip's speed the
 * moment anyone re-tokened it.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  marqueeDistancePx,
  marqueeDurationSeconds,
  MARQUEE_CELL_PX,
  MARQUEE_DEFAULT_SPEED,
  MARQUEE_GAP_PX,
  MARQUEE_QUOTE_CELL_PX,
  MARQUEE_QUOTE_GAP_PX,
} from "@/lib/sections/marquee";

const css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "app", "globals.css"),
  "utf8",
);

describe("marqueeDistancePx", () => {
  it("travels exactly one copy of the track: cells × (cell + gap)", () => {
    expect(marqueeDistancePx(6)).toBe(6 * (MARQUEE_CELL_PX + MARQUEE_GAP_PX));
  });

  it("never returns a negative distance", () => {
    expect(marqueeDistancePx(-4)).toBe(0);
  });
});

describe("marqueeDurationSeconds", () => {
  it("divides distance by speed", () => {
    // 6 cells × 212px = 1272px at 60px/s = 21.2s
    expect(marqueeDurationSeconds(6, 60)).toBe(21.2);
  });

  it("honours the contract's own default speed", () => {
    expect(marqueeDurationSeconds(6)).toBe(marqueeDurationSeconds(6, MARQUEE_DEFAULT_SPEED));
  });

  it("clamps a fast short track to something a human can read", () => {
    expect(marqueeDurationSeconds(1, 200)).toBe(4);
  });

  it("clamps a slow long track so it never looks frozen", () => {
    expect(marqueeDurationSeconds(24, 20)).toBe(240);
  });

  it("refuses to divide by zero", () => {
    expect(marqueeDurationSeconds(6, 0)).toBe(marqueeDurationSeconds(6, 1));
  });

  it("accepts the quote row's wider cell without changing the formula", () => {
    // 4 quotes × (340 + 20)px = 1440px at 60px/s = 24s
    expect(marqueeDurationSeconds(4, 60, MARQUEE_QUOTE_CELL_PX, MARQUEE_QUOTE_GAP_PX)).toBe(24);
    expect(marqueeDurationSeconds(4, 60)).toBeLessThan(24);
  });
});

describe("stylesheet parity", () => {
  it("states the strip cell and gap exactly as the CSS fallbacks", () => {
    expect(css, "--strip-cell drifted from MARQUEE_CELL_PX").toContain(
      `--strip-cell, ${MARQUEE_CELL_PX}px`,
    );
    expect(css, "strip gap drifted from MARQUEE_GAP_PX").toMatch(
      new RegExp(`\\.sf-strip__track\\s*\\{[^}]*--grid-gap,\\s*${MARQUEE_GAP_PX}px`),
    );
  });

  it("states the quote cell and gap exactly as the CSS fallbacks", () => {
    expect(css, "--quote-cell drifted from MARQUEE_QUOTE_CELL_PX").toContain(
      `--quote-cell, ${MARQUEE_QUOTE_CELL_PX}px`,
    );
    expect(css, "quote gap drifted from MARQUEE_QUOTE_GAP_PX").toMatch(
      new RegExp(`\\.sf-testimonials__track\\s*\\{[^}]*--grid-gap,\\s*${MARQUEE_QUOTE_GAP_PX}px`),
    );
  });
});
