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
import { resolveOverlayMotion, type OverlayMotionField, type ResolvedOverlayMotion } from "@/lib/search/motion";
import type { ButtonSize, ButtonVariant } from "@/components/ui/Button";
import type { BadgeBorderStyle } from "@/components/ui/Badge";
import type { SelectVariant } from "@/components/ui/Select";

/** Numeric limits for every ranged knob (clamped in resolveTheme). */
export const THEME_LIMITS = {
  radius: { min: 0, max: 24 },
  checkboxSize: { min: 16, max: 28 },
  checkboxRadius: { min: 0, max: 12 },
  toggleWidth: { min: 32, max: 64 },
  toggleHeight: { min: 20, max: 32 },
  customBadges: { min: 0, max: 20 },
  iconSize: { min: 16, max: 32 },
  iconStroke: { min: 1, max: 3 },
  textareaRows: { min: 2, max: 12 },
  arrowPadding: { min: 4, max: 24 },
  optionPadding: { min: 4, max: 16 },
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

/**
 * Admin-created badge face (custom badge creator). id + bg + textColor
 * required (incomplete entries are misses, dropped at resolve);
 * borderColor defaults to bg, borderStyle to solid.
 */
export interface CustomBadgeField {
  id?: string;
  label?: string;
  bg?: string;
  textColor?: string;
  borderColor?: string;
  borderStyle?: BadgeBorderStyle;
}

export interface ThemeBadgesField {
  custom?: CustomBadgeField[];
}

export interface ThemeIconField {
  size?: number;
  strokeWidth?: number;
  filled?: boolean;
  /** "" = currentColor behavior (no house override). */
  color?: string;
}

export interface ThemeTextareaField {
  bg?: string;
  textColor?: string;
  borderColor?: string;
  focusBorderColor?: string;
  borderRadius?: number;
  rows?: number;
}

export type SelectBranch = SelectVariant;

export interface ThemeSelectField {
  variant?: SelectBranch;
  bg?: string;
  textColor?: string;
  borderColor?: string;
  focusBorderColor?: string;
  borderRadius?: number;
  /** Custom-only faces (documented-ignored on native — OS chrome law). */
  selectedBg?: string;
  selectedText?: string;
  hoverBg?: string;
  hoverText?: string;
  /** Option vertical padding px (horizontal aligns with trigger text). */
  optionPaddingY?: number;
  arrowPadding?: number;
  /** CMS media URL (empty = chevron glyph; broken falls back at render). */
  arrowIconUrl?: string;
  /**
   * Popup motion (per-variant instance of the shared OverlayMotionField
   * shape — sixth instance of the solved problem; builtin = subtle fade).
   */
  dropdownAnimation?: OverlayMotionField;
}

/** Admin input: global theme scope (per-instance flat props still win). */
export interface ThemeSettings {
  button?: ThemeButtonField;
  input?: ThemeInputField;
  checkbox?: ThemeCheckboxField;
  toggle?: ThemeToggleField;
  badges?: ThemeBadgesField;
  icon?: ThemeIconField;
  textarea?: ThemeTextareaField;
  select?: ThemeSelectField;
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

export interface ResolvedCustomBadge {
  id: string;
  label: string;
  bg: string;
  textColor: string;
  borderColor: string;
  borderStyle: BadgeBorderStyle;
}

export interface ResolvedThemeBadges {
  custom: ResolvedCustomBadge[];
}

export interface ResolvedThemeIcon {
  size: number;
  strokeWidth: number;
  filled: boolean;
  color: string;
}

export interface ResolvedThemeTextarea {
  bg: string;
  textColor: string;
  borderColor: string;
  focusBorderColor: string;
  borderRadius: number;
  rows: number;
}

export interface ResolvedThemeSelect {
  variant: SelectBranch;
  bg: string;
  textColor: string;
  borderColor: string;
  focusBorderColor: string;
  borderRadius: number;
  selectedBg: string;
  selectedText: string;
  hoverBg: string;
  hoverText: string;
  optionPaddingY: number;
  arrowPadding: number;
  arrowIconUrl: string;
  dropdownAnimation: ResolvedOverlayMotion;
}

export interface ResolvedThemeSettings {
  button: ResolvedThemeButton;
  input: ResolvedThemeInput;
  checkbox: ResolvedThemeCheckbox;
  toggle: ResolvedThemeToggle;
  badges: ResolvedThemeBadges;
  icon: ResolvedThemeIcon;
  textarea: ResolvedThemeTextarea;
  select: ResolvedThemeSelect;
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
  badges: { custom: [] },
  icon: { size: 20, strokeWidth: 2, filled: false, color: "" },
  textarea: { bg: "", textColor: "", borderColor: "", focusBorderColor: "", borderRadius: 10, rows: 4 },
  // Native branch, today's paint, subtle fast fade (180ms — dropdowns
  // that pop feel broken; admin kills it via enabled: false).
  select: {
    variant: "native",
    bg: "",
    textColor: "",
    borderColor: "",
    focusBorderColor: "",
    borderRadius: 10,
    selectedBg: "",
    selectedText: "",
    hoverBg: "",
    hoverText: "",
    optionPaddingY: 8,
    arrowPadding: 12,
    arrowIconUrl: "",
    dropdownAnimation: { enabled: true, durationMs: 180, easing: "ease-out", travel: "minimal" },
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
  const bd = s?.badges ?? undefined;
  const ic = s?.icon ?? undefined;
  const ta = s?.textarea ?? undefined;
  const se = s?.select ?? undefined;
  const D = DEFAULT_THEME;
  const L = THEME_LIMITS;
  const clampFloat = (v: unknown, min: number, max: number, fallback: number): number => {
    const n = typeof v === "number" && Number.isFinite(v) ? v : fallback;
    return Math.min(max, Math.max(min, n));
  };
  const nonEmpty = (v: unknown): v is string => typeof v === "string" && v !== "";
  // Custom badges: id + bg + textColor required (incomplete = miss);
  // border defaults to bg, style union-checked to solid. Capped (sanity).
  const STYLES: BadgeBorderStyle[] = ["solid", "dashed", "dotted"];
  const custom: ResolvedCustomBadge[] = (Array.isArray(bd?.custom) ? bd.custom : [])
    .filter((e) => e && nonEmpty(e.id) && nonEmpty(e.bg) && nonEmpty(e.textColor))
    .slice(0, L.customBadges.max)
    .map((e) => ({
      id: e.id as string,
      label: nonEmpty(e.label) ? (e.label as string) : (e.id as string),
      bg: e.bg as string,
      textColor: e.textColor as string,
      borderColor: nonEmpty(e.borderColor) ? (e.borderColor as string) : (e.bg as string),
      borderStyle: e.borderStyle && STYLES.includes(e.borderStyle) ? e.borderStyle : "solid",
    }));
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
    badges: { custom },
    icon: {
      size: clampInt(ic?.size, L.iconSize.min, L.iconSize.max, D.icon.size),
      strokeWidth: clampFloat(ic?.strokeWidth, L.iconStroke.min, L.iconStroke.max, D.icon.strokeWidth),
      filled: ic?.filled ?? D.icon.filled,
      color: cleanColor(ic?.color, D.icon.color),
    },
    textarea: {
      bg: cleanColor(ta?.bg, D.textarea.bg),
      textColor: cleanColor(ta?.textColor, D.textarea.textColor),
      borderColor: cleanColor(ta?.borderColor, D.textarea.borderColor),
      focusBorderColor: cleanColor(ta?.focusBorderColor, D.textarea.focusBorderColor),
      borderRadius: clampInt(ta?.borderRadius, L.radius.min, L.radius.max, D.textarea.borderRadius),
      rows: clampInt(ta?.rows, L.textareaRows.min, L.textareaRows.max, D.textarea.rows),
    },
    select: {
      variant: se?.variant === "custom" || se?.variant === "native" ? se.variant : D.select.variant,
      bg: cleanColor(se?.bg, D.select.bg),
      textColor: cleanColor(se?.textColor, D.select.textColor),
      borderColor: cleanColor(se?.borderColor, D.select.borderColor),
      focusBorderColor: cleanColor(se?.focusBorderColor, D.select.focusBorderColor),
      borderRadius: clampInt(se?.borderRadius, L.radius.min, L.radius.max, D.select.borderRadius),
      selectedBg: cleanColor(se?.selectedBg, D.select.selectedBg),
      selectedText: cleanColor(se?.selectedText, D.select.selectedText),
      hoverBg: cleanColor(se?.hoverBg, D.select.hoverBg),
      hoverText: cleanColor(se?.hoverText, D.select.hoverText),
      optionPaddingY: clampInt(se?.optionPaddingY, L.optionPadding.min, L.optionPadding.max, D.select.optionPaddingY),
      arrowPadding: clampInt(se?.arrowPadding, L.arrowPadding.min, L.arrowPadding.max, D.select.arrowPadding),
      arrowIconUrl: cleanColor(se?.arrowIconUrl, D.select.arrowIconUrl),
      dropdownAnimation: resolveOverlayMotion(se?.dropdownAnimation ?? undefined, D.select.dropdownAnimation),
    },
  };
}
