/**
 * Overlay motion vocabulary — shared SHAPE, per-variant INSTANCES.
 *
 * Each overlay variant (sheet, palette, editorial, inspect) owns its own
 * motion config with its own travel/keyframes — a sheet slides, a modal
 * may fade, and neither setting may leak into the other. What they share
 * is this shape: enabled flag + preset-or-custom timing, resolved to
 * concrete ms + easing. Components never switch on preset names.
 *
 * Pure types + constants. No React, no fetch.
 */

export type OverlayMotionPreset = "smooth" | "snappy" | "oceanic" | "fast" | "flat" | "custom";

/** Admin-facing: everything optional (absent = inherit). */
export interface OverlayMotionField {
  enabled?: boolean;
  preset?: OverlayMotionPreset;
  /** Custom duration 150–500ms (only read when preset is "custom"). */
  durationMs?: number;
  /** Custom easing (only read when preset is "custom"). */
  easing?: string;
}

/** Resolved: concrete values the component inlines as CSS vars + data hooks. */
export interface ResolvedOverlayMotion {
  enabled: boolean;
  durationMs: number;
  easing: string;
  /**
   * Travel distance class (full = off-screen parks like sheets; minimal =
   * nudges like flat). Concrete value, not a preset name — CSS switches on
   * this, never on preset strings.
   */
  travel: "full" | "minimal";
}

export const MOTION_LIMITS = {
  durationMs: { min: 150, max: 500 },
} as const;

/**
 * Preset table: duration scales with travel distance (full-travel sheets
 * need room to read as motion, not a flinch). 240ms ease-out matches the
 * announcement collapse rhythm (220ms family); snappy reuses the wave
 * easing curve so the system speaks one motion language. Families:
 * oceanic = slow deliberate full travel; fast = quick full travel;
 * flat = minimal-travel nudge (8px, never off-screen parks). smooth/snappy
 * kept byte-identical (additive change — stored admin values keep working).
 */
export const MOTION_PRESETS: Record<
  Exclude<OverlayMotionPreset, "custom">,
  { durationMs: number; easing: string; travel: "full" | "minimal" }
> = {
  smooth: { durationMs: 240, easing: "ease-out", travel: "full" },
  snappy: { durationMs: 180, easing: "cubic-bezier(0.32, 0.72, 0.32, 1)", travel: "full" },
  oceanic: { durationMs: 320, easing: "cubic-bezier(0.32, 0.72, 0.32, 1)", travel: "full" },
  fast: { durationMs: 160, easing: "ease-out", travel: "full" },
  flat: { durationMs: 140, easing: "ease-out", travel: "minimal" },
};

/** Easing allowlist: unknown strings fall back (never inject raw CSS). */
const EASING_ALLOWLIST = new Set([
  "ease-out",
  "ease-in-out",
  "ease-in",
  "linear",
  "cubic-bezier(0.32, 0.72, 0.32, 1)",
]);

function clampInt(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === "number" && Number.isFinite(v) ? Math.round(v) : fallback;
  return Math.min(max, Math.max(min, n));
}

function cleanEasing(v: unknown, fallback: string): string {
  return typeof v === "string" && EASING_ALLOWLIST.has(v) ? v : fallback;
}

/**
 * Resolve one variant's motion: preset wins unless "custom" (then the
 * admin's duration/easing, clamped + allowlisted). Builtins = sheet
 * defaults (enabled, smooth 240 ease-out).
 */
export function resolveOverlayMotion(
  admin?: OverlayMotionField | null,
  builtin: ResolvedOverlayMotion = { enabled: true, durationMs: 240, easing: "ease-out", travel: "full" },
): ResolvedOverlayMotion {
  const enabled = admin?.enabled ?? builtin.enabled;
  // Builtins carry concrete values (no preset concept); an absent or
  // unknown admin preset falls back to smooth, never to a raw string.
  const preset: OverlayMotionPreset =
    admin?.preset !== undefined && admin.preset in MOTION_PRESETS
      ? (admin.preset as Exclude<OverlayMotionPreset, "custom">)
      : admin?.preset === "custom"
        ? "custom"
        : "smooth";
  if (preset !== "custom") {
    const table = MOTION_PRESETS[preset];
    return { enabled, durationMs: table.durationMs, easing: table.easing, travel: table.travel };
  }
  return {
    enabled,
    durationMs: clampInt(admin?.durationMs, MOTION_LIMITS.durationMs.min, MOTION_LIMITS.durationMs.max, builtin.durationMs),
    easing: cleanEasing(admin?.easing, builtin.easing),
    travel: builtin.travel,
  };
}
