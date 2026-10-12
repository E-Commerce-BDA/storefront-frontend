/**
 * Global theme vocabulary — Oceanic Blue v1.0
 * (Admin portal Theme Settings `/cms/theme`, 6.Admin-Panel.md §3.8.)
 *
 * House defaults for Button/Input/Checkbox/Toggle. Admin-facing fields
 * are all-optional (absent = inherit); resolved types are all-required;
 * literals live ONLY in DEFAULT_THEME. No logic beyond the resolver
 * below, no React, no fetch, no DB.
 *
 * Paint convention (shared with navSettings): "" is the concrete "no
 * house override" value — variant/component tokens apply. cleanStr keeps
 * "" (it's a decision, not a miss); only wrong-typed values fall back.
 * Numeric defaults mirror today's component defaults exactly.
 */

import type { ButtonAnimationField } from "./buttonAnimation";
import type { ButtonSize, ButtonVariant } from "@/components/ui/Button";

/** Numeric limits for every ranged knob (clamped in resolveTheme). */
export const THEME_LIMITS = {
  radius: { min: 0, max: 24 },
  checkboxSize: { min: 16, max: 28 },
  checkboxRadius: { min: 0, max: 12 },
  toggleWidth: { min: 32, max: 64 },
  toggleHeight: { min: 20, max: 32 },
} as const;

/* Admin-facing fields: all optional (absent = inherit). */

export interface ThemeButtonField {
  defaultVariant?: ButtonVariant;
  defaultSize?: ButtonSize;
  bg?: string;
  textColor?: string;
  borderColor?: string;
  borderRadius?: number;
  /**
   * Global animation layer (feeds resolveButtonAnimation as `global` —
   * internals resolve at the Button with variant colors, never here).
   */
  animation?: ButtonAnimationField;
}

export interface ThemeInputField {
  bg?: string;
  textColor?: string;
  borderColor?: string;
  focusBorderColor?: string;
  borderRadius?: number;
}

export interface ThemeCheckboxField {
  size?: number;
  boxBg?: string;
  tickColor?: string;
  borderColor?: string;
  borderRadius?: number;
}

export interface ThemeToggleField {
  width?: number;
  height?: number;
  onColor?: string;
  offColor?: string;
  knobColor?: string;
}

/** Admin input: global theme scope (per-instance flat props still win). */
export interface ThemeSettings {
  button?: ThemeButtonField;
  input?: ThemeInputField;
  checkbox?: ThemeCheckboxField;
  toggle?: ThemeToggleField;
}

/* Resolved types: all required (produced by resolveTheme below). */

export interface ResolvedThemeButton {
  defaultVariant: ButtonVariant;
  defaultSize: ButtonSize;
  bg: string;
  textColor: string;
  borderColor: string;
  borderRadius: number;
  animation: ButtonAnimationField;
}

export interface ResolvedThemeInput {
  bg: string;
  textColor: string;
  borderColor: string;
  focusBorderColor: string;
  borderRadius: number;
}

export interface ResolvedThemeCheckbox {
  size: number;
  boxBg: string;
  tickColor: string;
  borderColor: string;
  borderRadius: number;
}

export interface ResolvedThemeToggle {
  width: number;
  height: number;
  onColor: string;
  offColor: string;
  knobColor: string;
}

export interface ResolvedThemeSettings {
  button: ResolvedThemeButton;
  input: ResolvedThemeInput;
  checkbox: ResolvedThemeCheckbox;
  toggle: ResolvedThemeToggle;
}

/* Builtins: today's look = final fallback. */

export const DEFAULT_THEME: ResolvedThemeSettings = {
  button: {
    defaultVariant: "primary",
    defaultSize: "md",
    bg: "",
    textColor: "",
    borderColor: "",
    borderRadius: 8,
    animation: {},
  },
  input: {
    bg: "",
    textColor: "",
    borderColor: "",
    focusBorderColor: "",
    borderRadius: 10,
  },
  checkbox: {
    size: 20,
    boxBg: "",
    tickColor: "#FFFFFF",
    borderColor: "",
    borderRadius: 6,
  },
  toggle: {
    width: 44,
    height: 24,
    onColor: "",
    offColor: "",
    knobColor: "#FFFFFF",
  },
};

const clampInt = (v: unknown, min: number, max: number, fallback: number): number => {
  const n = typeof v === "number" && Number.isFinite(v) ? Math.round(v) : fallback;
  return Math.min(max, Math.max(min, n));
};

/** Non-empty strings pass ("" = no house override, kept deliberately). */
const cleanColor = (v: unknown, fallback: string): string =>
  typeof v === "string" ? v : fallback;

const VARIANTS: ButtonVariant[] = ["primary", "light", "ghost-ink", "sale", "success", "error"];
const SIZES: ButtonSize[] = ["sm", "md", "lg"];

export interface ResolveThemeInput {
  /** CMS admin values. Null/undefined = CMS unreadable (builtins render). */
  settings?: ThemeSettings | null;
}

/**
 * Pure global merge: admin ?? DEFAULT_THEME. Wrong-typed values are
 * misses (builtins render, never blank); "" colors are kept (no-override
 * decisions, see header). Animation forwards merged as the global layer
 * for resolveButtonAnimation — never resolved here (needs variant colors).
 */
export function resolveThemeSettings(input: ResolveThemeInput): ResolvedThemeSettings {
  const s = input.settings ?? undefined;
  const b = s?.button ?? undefined;
  const i = s?.input ?? undefined;
  const c = s?.checkbox ?? undefined;
  const t = s?.toggle ?? undefined;
  const D = DEFAULT_THEME;
  const L = THEME_LIMITS;
  return {
    button: {
      defaultVariant: b?.defaultVariant && VARIANTS.includes(b.defaultVariant) ? b.defaultVariant : D.button.defaultVariant,
      defaultSize: b?.defaultSize && SIZES.includes(b.defaultSize) ? b.defaultSize : D.button.defaultSize,
      bg: cleanColor(b?.bg, D.button.bg),
      textColor: cleanColor(b?.textColor, D.button.textColor),
      borderColor: cleanColor(b?.borderColor, D.button.borderColor),
      borderRadius: clampInt(b?.borderRadius, L.radius.min, L.radius.max, D.button.borderRadius),
      animation: { ...(b?.animation ?? {}) },
    },
    input: {
      bg: cleanColor(i?.bg, D.input.bg),
      textColor: cleanColor(i?.textColor, D.input.textColor),
      borderColor: cleanColor(i?.borderColor, D.input.borderColor),
      focusBorderColor: cleanColor(i?.focusBorderColor, D.input.focusBorderColor),
      borderRadius: clampInt(i?.borderRadius, L.radius.min, L.radius.max, D.input.borderRadius),
    },
    checkbox: {
      size: clampInt(c?.size, L.checkboxSize.min, L.checkboxSize.max, D.checkbox.size),
      boxBg: cleanColor(c?.boxBg, D.checkbox.boxBg),
      tickColor: cleanColor(c?.tickColor, D.checkbox.tickColor),
      borderColor: cleanColor(c?.borderColor, D.checkbox.borderColor),
      borderRadius: clampInt(c?.borderRadius, L.checkboxRadius.min, L.checkboxRadius.max, D.checkbox.borderRadius),
    },
    toggle: {
      width: clampInt(t?.width, L.toggleWidth.min, L.toggleWidth.max, D.toggle.width),
      height: clampInt(t?.height, L.toggleHeight.min, L.toggleHeight.max, D.toggle.height),
      onColor: cleanColor(t?.onColor, D.toggle.onColor),
      offColor: cleanColor(t?.offColor, D.toggle.offColor),
      knobColor: cleanColor(t?.knobColor, D.toggle.knobColor),
    },
  };
}
