/**
 * Marquee arithmetic — sf-060
 *
 * The CMS speaks **speed in px/s** (`section-settings.ts`, capped 20..200) and a
 * CSS animation wants **seconds**. The distance one loop travels is exactly one
 * copy of the track — the track is duplicated and translated `-50%` — so the
 * conversion needs the track's own width, which is `cells × (cell + gap)`.
 *
 * Both numbers are stated here and mirrored by the stylesheet's fallbacks
 * (`--strip-cell` / `--grid-gap`). A block that invented its own constant would
 * silently disagree with the CSS, and a marquee whose speed drifts with the
 * viewport is the thing this file exists to prevent.
 */

/** Matches the `--strip-cell` fallback in `.sf-strip__cell`. */
export const MARQUEE_CELL_PX = 180;
/** Matches the `--grid-gap` fallback used by the strip track. */
export const MARQUEE_GAP_PX = 32;
/** Matches the `--quote-cell` fallback in the testimonial marquee. */
export const MARQUEE_QUOTE_CELL_PX = 340;
/** Matches the testimonial track's own gap fallback. */
export const MARQUEE_QUOTE_GAP_PX = 20;
/** The contract's own default velocity, restated once for the blocks. */
export const MARQUEE_DEFAULT_SPEED = 60;

/** One loop is this many pixels of travel. */
export function marqueeDistancePx(cellCount: number, cellPx = MARQUEE_CELL_PX, gapPx = MARQUEE_GAP_PX): number {
  return Math.max(0, cellCount) * (cellPx + gapPx);
}

/**
 * `px ÷ (px/s) = s`, clamped to something a human can read.
 *
 * The 4 s floor exists for a two-cell track: at 200 px/s the raw number drops
 * under a second and the strip strobes. The cap is not a speed limit — a
 * one-cell track would otherwise run for hours and look frozen.
 *
 * Cell metrics are a parameter because the strip and the quote row are different
 * widths; a duration computed from the wrong cell makes the *quote* row travel at
 * the strip's speed, which is exactly the drift this file is supposed to prevent.
 */
export function marqueeDurationSeconds(
  cellCount: number,
  speedPxPerSecond = MARQUEE_DEFAULT_SPEED,
  cellPx = MARQUEE_CELL_PX,
  gapPx = MARQUEE_GAP_PX,
): number {
  const speed = Math.max(1, speedPxPerSecond);
  const seconds = marqueeDistancePx(cellCount, cellPx, gapPx) / speed;
  return Math.min(240, Math.max(4, Number(seconds.toFixed(2))));
}
