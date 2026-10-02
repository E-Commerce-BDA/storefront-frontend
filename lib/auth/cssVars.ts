/**
 * Auth CSS var emitter — Oceanic Blue v1.0
 * (Documentation/pages/auth-design.md §3 + AGENTS.md §3.7)
 *
 * Pure string assembly: resolved settings → flat `--auth-*` var map.
 * Zero decisions here — clamps, cascade and sanitizing already happened in
 * resolveSettings.ts. Paint-only knobs are emitted; behavior/content/seo
 * travel as props, never as vars (they are not paint).
 *
 * No React, no fetch.
 */

import type { ResolvedAuthStyle, ResolvedPanelGradient } from "./settings";

const FONT_STACKS = {
  outfit: '"Outfit", system-ui, sans-serif',
  fraunces: '"Fraunces", Georgia, serif',
  system: "system-ui, sans-serif",
} as const;

const FORM_SURFACES = {
  white: "#ffffff",
  tinted: "#f5fafc",
  transparent: "transparent",
} as const;

function formChrome(elevation: ResolvedAuthStyle["form"]["elevation"]): { border: string; shadow: string } {
  switch (elevation) {
    case "flat":
      return { border: "none", shadow: "none" };
    case "floating":
      return { border: "1px solid #dce8ee", shadow: "0 8px 32px rgba(10, 37, 64, 0.08)" };
    default:
      return { border: "1px solid #dce8ee", shadow: "none" };
  }
}

/** Gradient union → one CSS background value (presentation, not logic). */
export function panelBackgroundValue(gradient: ResolvedPanelGradient): string {
  const stops = gradient.stops.map((s) => `${s.color} ${s.at}%`).join(", ");
  switch (gradient.type) {
    case "radial":
      return `radial-gradient(${gradient.shape} at ${gradient.at}, ${stops})`;
    case "conic":
      return `conic-gradient(from ${gradient.from}deg at ${gradient.at}, ${stops})`;
    default:
      return `linear-gradient(${gradient.angle}deg, ${stops})`;
  }
}

/** Panel background by mode: computed gradient, solid, image layer, or none. */
export function panelBackground(style: ResolvedAuthStyle): string {
  const p = style.panel;
  switch (p.bgMode) {
    case "solid":
      return p.solid;
    case "image":
      return p.imageUrl === "" ? "transparent" : `url("${p.imageUrl}")`;
    case "pattern":
      return "radial-gradient(rgba(255, 255, 255, 0.22) 1px, transparent 1px)";
    case "none":
      return "transparent";
    default:
      return panelBackgroundValue(p.gradient);
  }
}

/** Full paint map for one resolved page style. Keys are the contract that
 *  components/auth/* consumes (style-contract tests pin this list). */
export function authCssVars(style: ResolvedAuthStyle): Record<string, string> {
  const chrome = formChrome(style.form.elevation);
  const t = style.typography;
  const el = (prefix: string, s: { size: number; weight: number; color: string; align: string }) => ({
    [`--auth-${prefix}-size`]: `${s.size}px`,
    [`--auth-${prefix}-weight`]: String(s.weight),
    [`--auth-${prefix}-color`]: s.color,
    [`--auth-${prefix}-align`]: s.align,
  });
  return {
    "--auth-form-bg": FORM_SURFACES[style.form.surface],
    "--auth-form-radius": `${style.form.radius}px`,
    "--auth-form-width": `${style.form.width}px`,
    "--auth-form-border": chrome.border,
    "--auth-form-shadow": chrome.shadow,
    "--auth-input-bg": style.inputs.bg,
    "--auth-input-border": style.inputs.border,
    "--auth-input-radius": `${style.inputs.radius}px`,
    "--auth-input-text": style.inputs.text,
    "--auth-input-placeholder": style.inputs.placeholder,
    "--auth-input-focus-border": style.inputs.focusBorder,
    "--auth-input-focus-ring": style.inputs.focusRing,
    "--auth-input-focus-ring-width": `${style.inputs.focusRingWidth}px`,
    "--auth-input-focus-shadow": `0 0 0 ${style.inputs.focusRingWidth}px ${style.inputs.focusRing}`,
    "--auth-input-error-border": style.inputs.errorBorder,
    "--auth-panel-bg": panelBackground(style),
    "--auth-panel-overlay-opacity": String(style.panel.overlay / 100),
    "--auth-panel-logo-height": `${style.panel.logoHeight}px`,
    "--auth-font": FONT_STACKS[style.typography.family],
    ...el("headline", t.headline),
    ...el("sub", t.sub),
    ...el("bullets", t.bullets),
    ...el("quote", t.quote),
    ...el("form-title", t.formTitle),
    ...el("labels", t.labels),
    "--auth-page-fade": `${style.motion.pageFadeMs}ms`,
  };
}
