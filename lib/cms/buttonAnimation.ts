/**
 * Button wave-animation contract — Oceanic Blue v1.0
 * (Documentation/design-system/storefront.md §7.1 + §6, 6.Admin-Panel.md §4.2/§4.6/§5)
 *
 * Dumb-component rule: this file holds types + hardcoded defaults + pure
 * resolvers only. No fetch, no React, no DB. Parent resolves P>S>G and passes
 * the final object into `<Button animation={...}>`.
 *
 * Future network shape (admin panel, NOT implemented yet):
 * - Global default:  `GET /cms/settings/global` → `theme.buttonAnimation: ButtonAnimationField`
 * - Per-button override: `cms_sections.content.slides[].ctas[].animation: ButtonAnimationField`
 *   (same shape for `banner.content.ctas[].animation`). Absent key = inherit,
 *   never `null` — admin "Reset to global" deletes the key (§5.3).
 * - Precedence: `cta.animation ?? section.settings.buttonAnimation ?? global.theme.buttonAnimation ?? DEFAULT_BUTTON_ANIMATION`
 *
 * Today `global`/`section` are `undefined`, so every button resolves to the
 * same `DEFAULT_BUTTON_ANIMATION` (+ per-variant hover colors from Button.tsx).
 */

export type WaveOrigin = "bottom" | "top" | "left" | "right";

export type AnimationKind =
  | "wave-rise"
  | "fade"
  | "fade-in"
  | "fade-out"
  | "fade-in-out"
  | "linear"
  | "none";

/**
 * Every knob the admin panel will expose. All optional at the CTA level
 * (partial = inherit), all required once resolved.
 *
 * - waveOrigin: which edge the wave rises from.
 * - peaks: number of wave crests (1-3). 2-3 = wavy multi-peak look.
 * - peakHeight: crest depth in px (wave strip height). Range 4-24.
 * - hoverBg/hoverText/hoverBorderColor: hover palette. hoverBorderColor is
 *   independently pickable from day one (defaults to hoverBg when "auto").
 * - durationMs: wave travel time (0-1000). Spec default 360.
 * - textDelayMs: text/border swap delay (0-500). Spec default 200.
 * - easing: CSS timing function. Presets in EASING_PRESETS, custom allowed.
 * - animationKind: interaction model (wave travel vs fades vs linear vs none).
 * - enabled/useWave: master kill-switches. enabled=false OR kind=none OR
 *   useWave=false+fade-kind → no travelling wave layer.
 */
export interface ButtonAnimationField {
  enabled?: boolean;
  useWave?: boolean;
  waveOrigin?: WaveOrigin;
  peaks?: number;
  peakHeight?: number;
  hoverBg?: string;
  hoverText?: string;
  hoverBorderColor?: string;
  durationMs?: number;
  textDelayMs?: number;
  easing?: string;
  animationKind?: AnimationKind;
  /** Disabled/loading face + pressed effect — nested so "apply to all of
   *  type" can target one group without touching the rest. */
  disabled?: ButtonDisabledField;
  pressed?: ButtonPressedField;
}

/**
 * Disabled + loading share one universal face (locked by design review:
 * loading is non-interactive, so it can never have its own look).
 * All optional at every scope (absent = inherit); all required once resolved.
 *
 * - bg/textColor/borderColor/borderWidth: the dead-button face. Defaults are
 *   ink on mist-border (≈12:1) — explicit solids, never opacity, because
 *   fading text and face together destroys contrast.
 * - hoverEnabled: kill-switch in reverse. Default false = no hover layer,
 *   no swap on disabled (the shipped bug, now impossible by default).
 *   true opts into a palette-only swap (never the travelling wave).
 */
export interface ButtonDisabledField {
  bg?: string;
  textColor?: string;
  borderColor?: string;
  borderWidth?: number;
  hoverEnabled?: boolean;
}

/**
 * Pressed (:active) effect. Default reproduces today exactly (no visible
 * press — the codebase never had an :active rule), admin opts in.
 * Momentary state (~150ms) so the knob set stays tiny on purpose.
 */
export interface ButtonPressedField {
  enabled?: boolean;
  /** Uniform scale at press depth, e.g. 0.98. Range 0.9–1 (never grows). */
  scale?: number;
  /** Vertical dip in px, e.g. 1. Range 0–8. */
  translateY?: number;
  /** Shadow while pressed ("none" flattens). Any box-shadow or "none". */
  shadow?: string;
}

/** Fully resolved animation — every field concrete. */
export interface ResolvedButtonAnimation {
  enabled: boolean;
  useWave: boolean;
  waveOrigin: WaveOrigin;
  peaks: 1 | 2 | 3;
  peakHeight: number;
  hoverBg: string;
  hoverText: string;
  /** Concrete color (never "auto") — falls back to hoverBg. */
  hoverBorderColor: string;
  durationMs: number;
  textDelayMs: number;
  easing: string;
  animationKind: AnimationKind;
  disabled: ResolvedButtonDisabled;
  pressed: ResolvedButtonPressed;
}

export interface ResolvedButtonDisabled {
  bg: string;
  textColor: string;
  borderColor: string;
  borderWidth: number;
  hoverEnabled: boolean;
}

export interface ResolvedButtonPressed {
  enabled: boolean;
  scale: number;
  translateY: number;
  shadow: string;
}

export const ANIMATION_KINDS: AnimationKind[] = [
  "wave-rise",
  "fade",
  "fade-in",
  "fade-out",
  "fade-in-out",
  "linear",
  "none",
];

export const WAVE_ORIGINS: WaveOrigin[] = ["bottom", "top", "left", "right"];

export const EASING_PRESETS: Record<string, string> = {
  smooth: "cubic-bezier(0.32, 0.72, 0.32, 1)",
  easeInOut: "ease-in-out",
  easeOut: "ease-out",
  linear: "linear",
};

export const ANIMATION_LIMITS = {
  peaks: { min: 1, max: 3 },
  peakHeight: { min: 4, max: 24 },
  durationMs: { min: 0, max: 1000 },
  textDelayMs: { min: 0, max: 500 },
  pressedScale: { min: 0.9, max: 1 },
  pressedTranslateY: { min: 0, max: 8 },
  disabledBorderWidth: { min: 0, max: 4 },
} as const;

/**
 * Single shared default — every button looks identical today.
 * Wavy multi-peak (peaks: 2) per request. Colors come from the variant, so
 * hoverBg/hoverText/hoverBorderColor are intentionally NOT set here.
 */
export const DEFAULT_BUTTON_ANIMATION: {
  enabled: boolean;
  useWave: boolean;
  waveOrigin: WaveOrigin;
  peaks: 1 | 2 | 3;
  peakHeight: number;
  durationMs: number;
  textDelayMs: number;
  easing: string;
  animationKind: AnimationKind;
} = {
  enabled: true,
  useWave: true,
  waveOrigin: "bottom",
  peaks: 2,
  peakHeight: 12,
  durationMs: 360,
  textDelayMs: 200,
  easing: EASING_PRESETS.smooth,
  animationKind: "wave-rise",
};

/**
 * Universal dead-button face. Ink on mist-border (≈12:1) — explicit solids
 * by contract (see globals.css disabled block: never opacity).
 */
export const DEFAULT_BUTTON_DISABLED: {
  bg: string;
  textColor: string;
  borderColor: string;
  borderWidth: number;
  hoverEnabled: boolean;
} = {
  bg: "#dce8ee",
  textColor: "#0a2540",
  borderColor: "#dce8ee",
  borderWidth: 1,
  hoverEnabled: false,
};

/**
 * Pressed effect ships OFF to reproduce today exactly (no :active rule ever
 * existed). Admin opts in; scale/translateY/shadow then apply.
 */
export const DEFAULT_BUTTON_PRESSED: {
  enabled: boolean;
  scale: number;
  translateY: number;
  shadow: string;
} = {
  enabled: false,
  scale: 1,
  translateY: 0,
  shadow: "none",
};

const clampInt = (v: unknown, min: number, max: number, fallback: number): number => {
  const n = typeof v === "number" && Number.isFinite(v) ? Math.round(v) : fallback;
  return Math.min(max, Math.max(min, n));
};

const clampPeaks = (v: unknown): 1 | 2 | 3 => {
  const n = clampInt(v, 1, 3, DEFAULT_BUTTON_ANIMATION.peaks);
  return (n === 1 ? 1 : n === 3 ? 3 : 2) as 1 | 2 | 3;
};

export interface AnimationColorFallback {
  hoverBg: string;
  hoverText: string;
}

export interface ResolveAnimationInput {
  /** Per-button override — future `ctas[].animation` payload. Highest precedence. */
  cta?: ButtonAnimationField;
  /** Per-section default — future `section.settings.buttonAnimation`. */
  section?: ButtonAnimationField;
  /** Global default — future `theme.buttonAnimation`. */
  global?: ButtonAnimationField;
  /** Variant hover colors (Button.tsx VARIANTS). Lowest precedence for colors. */
  colors: AnimationColorFallback;
}

/**
 * Pure P>S>G merge: cta ?? section ?? global ?? DEFAULT.
 * `hoverBorderColor: "auto" | undefined` → falls back to resolved hoverBg,
 * keeping it independently pickable from day one.
 */
export function resolveButtonAnimation(input: ResolveAnimationInput): ResolvedButtonAnimation {
  const { cta, section, global, colors } = input;

  const pick = <K extends keyof ButtonAnimationField>(key: K): ButtonAnimationField[K] | undefined =>
    cta?.[key] ?? section?.[key] ?? global?.[key];

  const hoverBg = pick("hoverBg") ?? colors.hoverBg;
  const hoverText = pick("hoverText") ?? colors.hoverText;
  const rawBorder = pick("hoverBorderColor");
  const hoverBorderColor =
    rawBorder === undefined || rawBorder === "auto" || rawBorder === "" ? hoverBg : rawBorder;

  const kind = pick("animationKind") ?? DEFAULT_BUTTON_ANIMATION.animationKind;
  const enabled = pick("enabled") ?? DEFAULT_BUTTON_ANIMATION.enabled;

  // Nested groups merge per-key through the same cta ?? section ?? global
  // chain, so "apply to all of type" targets one group without touching
  // the other. Flat component props (highest precedence) are already folded
  // into `cta` by Button.tsx before this runs.
  const pickNested = <G extends keyof Pick<ButtonAnimationField, "disabled" | "pressed">>(
    group: G,
  ): NonNullable<ButtonAnimationField[G]> =>
    ({ ...global?.[group], ...section?.[group], ...cta?.[group] }) as NonNullable<
      ButtonAnimationField[G]
    >;
  const disabledIn = pickNested("disabled");
  const pressedIn = pickNested("pressed");

  const clampFloat = (v: unknown, min: number, max: number, fallback: number): number => {
    const n = typeof v === "number" && Number.isFinite(v) ? v : fallback;
    return Math.min(max, Math.max(min, n));
  };

  return {
    enabled: kind === "none" ? false : enabled,
    useWave: pick("useWave") ?? DEFAULT_BUTTON_ANIMATION.useWave,
    waveOrigin: pick("waveOrigin") ?? DEFAULT_BUTTON_ANIMATION.waveOrigin,
    peaks: clampPeaks(pick("peaks")),
    peakHeight: clampInt(
      pick("peakHeight"),
      ANIMATION_LIMITS.peakHeight.min,
      ANIMATION_LIMITS.peakHeight.max,
      DEFAULT_BUTTON_ANIMATION.peakHeight,
    ),
    hoverBg,
    hoverText,
    hoverBorderColor,
    durationMs: clampInt(
      pick("durationMs"),
      ANIMATION_LIMITS.durationMs.min,
      ANIMATION_LIMITS.durationMs.max,
      DEFAULT_BUTTON_ANIMATION.durationMs,
    ),
    textDelayMs: clampInt(
      pick("textDelayMs"),
      ANIMATION_LIMITS.textDelayMs.min,
      ANIMATION_LIMITS.textDelayMs.max,
      DEFAULT_BUTTON_ANIMATION.textDelayMs,
    ),
    easing: pick("easing") ?? DEFAULT_BUTTON_ANIMATION.easing,
    animationKind: kind,
    disabled: {
      bg: disabledIn.bg ?? DEFAULT_BUTTON_DISABLED.bg,
      textColor: disabledIn.textColor ?? DEFAULT_BUTTON_DISABLED.textColor,
      borderColor: disabledIn.borderColor ?? DEFAULT_BUTTON_DISABLED.borderColor,
      borderWidth: clampInt(
        disabledIn.borderWidth,
        ANIMATION_LIMITS.disabledBorderWidth.min,
        ANIMATION_LIMITS.disabledBorderWidth.max,
        DEFAULT_BUTTON_DISABLED.borderWidth,
      ),
      hoverEnabled: disabledIn.hoverEnabled ?? DEFAULT_BUTTON_DISABLED.hoverEnabled,
    },
    pressed: {
      enabled: pressedIn.enabled ?? DEFAULT_BUTTON_PRESSED.enabled,
      scale: clampFloat(
        pressedIn.scale,
        ANIMATION_LIMITS.pressedScale.min,
        ANIMATION_LIMITS.pressedScale.max,
        DEFAULT_BUTTON_PRESSED.scale,
      ),
      translateY: clampInt(
        pressedIn.translateY,
        ANIMATION_LIMITS.pressedTranslateY.min,
        ANIMATION_LIMITS.pressedTranslateY.max,
        DEFAULT_BUTTON_PRESSED.translateY,
      ),
      shadow: pressedIn.shadow ?? DEFAULT_BUTTON_PRESSED.shadow,
    },
  };
}

/** CSS custom properties consumed by `globals.css` `.sf-btn`. Units resolved here. */
export function buttonAnimationCssVars(resolved: ResolvedButtonAnimation): Record<string, string> {
  return {
    "--wave-bg": resolved.hoverBg,
    "--wave-text": resolved.hoverText,
    "--wave-border": resolved.hoverBorderColor,
    "--wave-duration": `${resolved.durationMs}ms`,
    "--wave-delay": `${resolved.textDelayMs}ms`,
    "--wave-easing": resolved.easing,
    "--wave-peak": `${resolved.peakHeight}px`,
    "--btn-disabled-bg": resolved.disabled.bg,
    "--btn-disabled-text": resolved.disabled.textColor,
    "--btn-disabled-border": resolved.disabled.borderColor,
    "--btn-disabled-bw": `${resolved.disabled.borderWidth}px`,
    "--pressed-scale": String(resolved.pressed.scale),
    "--pressed-translate": `${resolved.pressed.translateY}px`,
    "--pressed-shadow": resolved.pressed.shadow,
  };
}
