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
import type {
  BadgePosition,
  CtaPosition,
  HoverMode,
  MediaRatio,
  QuickAction,
} from "@/lib/commerce/productCard";
import type { ButtonSize, ButtonVariant } from "@/components/ui/Button";
import type { BadgeBorderStyle } from "@/components/ui/Badge";
import type { SelectVariant } from "@/components/ui/Select";
import {
  DEFAULT_TOOLTIP_STYLE,
  TOOLTIP_LIMITS,
  type TooltipAnimation,
  type TooltipStyleField,
} from "@/components/ui/Tooltip";

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
  overlayAlpha: { min: 0, max: 100 },
  dialogRadius: { min: 0, max: 24 },
  dialogMaxWidth: { min: 320, max: 720 },
  dialogTitleSize: { min: 14, max: 24 },
  dialogBodySize: { min: 12, max: 16 },
  dialogBodyWeight: { min: 400, max: 700 },
  cardRadius: { min: 0, max: 24 },
  nameSize: { min: 12, max: 22 },
  priceSize: { min: 12, max: 22 },
  gridCols: { min: 1, max: 5 },
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

/**
 * Product-card house style (product.md §9). Columns are listing-level
 * (the card never knows siblings) — desktop/tablet/phone each clamped
 * to their legibility ranges (5/3/2 caps: 4-up tablet and 3-up phone
 * squeeze cards illegible, so the resolver caps, never the CSS).
 */
export interface ThemeProductCardField {
  cardBg?: string;
  borderColor?: string;
  borderRadius?: number;
  mediaRatio?: MediaRatio;
  badgePosition?: BadgePosition;
  showBadge?: boolean;
  showRatings?: boolean;
  showDept?: boolean;
  hoverMode?: HoverMode;
  ctaSet?: QuickAction[];
  ctaPosition?: CtaPosition;
  showActionsOnTouch?: boolean;
  nameSize?: number;
  priceSize?: number;
  colsDesktop?: number;
  colsTablet?: number;
  colsPhone?: number;
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

/**
 * Tooltip house style. Same shape as the component's style object by
 * design — resolved output feeds Tooltip's `styleOverrides` prop (its
 * documented lowest-precedence slot), so theming needs zero component
 * change. Own micro-motion kept (never shared presets).
 */
export type ThemeTooltipField = TooltipStyleField;

export interface ThemeDialogField {
  overlayColor?: string;
  /** Overlay wash alpha 0–100. */
  overlayAlpha?: number;
  panelBg?: string;
  borderColor?: string;
  borderRadius?: number;
  /** Panel width cap px. */
  maxWidth?: number;
  titleColor?: string;
  titleSize?: number;
  /** Inherited panel defaults (owner direct styles win automatically). */
  bodySize?: number;
  bodyWeight?: number;
  bodyColor?: string;
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
  tooltip?: ThemeTooltipField;
  dialog?: ThemeDialogField;
  productCard?: ThemeProductCardField;
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

/** Resolved tooltip style: all concrete (feeds styleOverrides as-is). */
export type ResolvedThemeTooltip = Required<TooltipStyleField>;

export interface ResolvedThemeDialog {
  overlayColor: string;
  overlayAlpha: number;
  panelBg: string;
  borderColor: string;
  borderRadius: number;
  maxWidth: number;
  titleColor: string;
  titleSize: number;
  bodySize: number;
  bodyWeight: number;
  bodyColor: string;
}

export interface ResolvedThemeProductCard {
  cardBg: string;
  borderColor: string;
  borderRadius: number;
  mediaRatio: MediaRatio;
  badgePosition: BadgePosition;
  showBadge: boolean;
  showRatings: boolean;
  showDept: boolean;
  hoverMode: HoverMode;
  ctaSet: QuickAction[];
  ctaPosition: CtaPosition;
  showActionsOnTouch: boolean;
  nameSize: number;
  priceSize: number;
  colsDesktop: number;
  colsTablet: number;
  colsPhone: number;
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
  tooltip: ResolvedThemeTooltip;
  dialog: ResolvedThemeDialog;
  productCard: ResolvedThemeProductCard;
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
  // Tooltip builtins mirror DEFAULT_TOOLTIP_STYLE exactly (same source —
  // imported, not duplicated, so they can't drift).
  tooltip: { ...DEFAULT_TOOLTIP_STYLE },
  // Dialog builtins mirror today's hardcoded look: ink wash at half,
  // white panel, radius-card 12, max-w-md 448, ink title 18.
  dialog: {
    overlayColor: "#0a2540",
    overlayAlpha: 50,
    panelBg: "#ffffff",
    borderColor: "",
    borderRadius: 12,
    maxWidth: 448,
    titleColor: "",
    titleSize: 18,
    bodySize: 14,
    bodyWeight: 400,
    bodyColor: "",
  },
  // Card builtins mirror today's component defaults: transparent card,
  // 4:5 media, left badge, actions-center, 15px info faces.
  productCard: {
    cardBg: "",
    borderColor: "",
    borderRadius: 0,
    mediaRatio: "4:5",
    badgePosition: "left",
    showBadge: true,
    showRatings: true,
    showDept: true,
    hoverMode: "actions",
    ctaSet: ["quick-view", "wishlist", "add-to-cart"],
    ctaPosition: "center",
    showActionsOnTouch: false,
    nameSize: 15,
    priceSize: 15,
    colsDesktop: 4,
    colsTablet: 3,
    colsPhone: 2,
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
  const tt = s?.tooltip ?? undefined;
  const dg = s?.dialog ?? undefined;
  const pc = s?.productCard ?? undefined;
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
    // Tooltip resolves through its own limits (imported — same source as
    // the component, so admin ranges can never disagree with it).
    tooltip: {
      bg: cleanColor(tt?.bg, D.tooltip.bg),
      textColor: cleanColor(tt?.textColor, D.tooltip.textColor),
      borderColor: cleanColor(tt?.borderColor, D.tooltip.borderColor),
      borderWidth: clampInt(tt?.borderWidth, TOOLTIP_LIMITS.borderWidth.min, TOOLTIP_LIMITS.borderWidth.max, D.tooltip.borderWidth),
      radius: clampInt(tt?.radius, TOOLTIP_LIMITS.radius.min, TOOLTIP_LIMITS.radius.max, D.tooltip.radius),
      fontSize: clampInt(tt?.fontSize, TOOLTIP_LIMITS.fontSize.min, TOOLTIP_LIMITS.fontSize.max, D.tooltip.fontSize),
      fontWeight: clampInt(tt?.fontWeight ?? undefined, 400, 700, D.tooltip.fontWeight),
      animation: tt?.animation === "slide" || tt?.animation === "fade" || tt?.animation === "none" ? tt.animation : D.tooltip.animation,
      durationMs: clampInt(tt?.durationMs, TOOLTIP_LIMITS.durationMs.min, TOOLTIP_LIMITS.durationMs.max, D.tooltip.durationMs),
      offset: clampInt(tt?.offset, TOOLTIP_LIMITS.offset.min, TOOLTIP_LIMITS.offset.max, D.tooltip.offset),
    },
    dialog: {
      overlayColor: cleanColor(dg?.overlayColor, D.dialog.overlayColor),
      overlayAlpha: clampInt(dg?.overlayAlpha, L.overlayAlpha.min, L.overlayAlpha.max, D.dialog.overlayAlpha),
      panelBg: cleanColor(dg?.panelBg, D.dialog.panelBg),
      borderColor: cleanColor(dg?.borderColor, D.dialog.borderColor),
      borderRadius: clampInt(dg?.borderRadius, L.dialogRadius.min, L.dialogRadius.max, D.dialog.borderRadius),
      maxWidth: clampInt(dg?.maxWidth, L.dialogMaxWidth.min, L.dialogMaxWidth.max, D.dialog.maxWidth),
      titleColor: cleanColor(dg?.titleColor, D.dialog.titleColor),
      titleSize: clampInt(dg?.titleSize, L.dialogTitleSize.min, L.dialogTitleSize.max, D.dialog.titleSize),
      bodySize: clampInt(dg?.bodySize, L.dialogBodySize.min, L.dialogBodySize.max, D.dialog.bodySize),
      bodyWeight: clampInt(dg?.bodyWeight, 400, 700, D.dialog.bodyWeight),
      bodyColor: cleanColor(dg?.bodyColor, D.dialog.bodyColor),
    },
    // Columns clamp to legibility ranges (5/3/2 caps — CSS never sees an
    // absurd count; ctaSet clamps to 3 with unknown actions dropped).
    productCard: {
      cardBg: cleanColor(pc?.cardBg, D.productCard.cardBg),
      borderColor: cleanColor(pc?.borderColor, D.productCard.borderColor),
      borderRadius: clampInt(pc?.borderRadius, L.cardRadius.min, L.cardRadius.max, D.productCard.borderRadius),
      mediaRatio:
        pc?.mediaRatio === "3:4" ||
        pc?.mediaRatio === "4:3" ||
        pc?.mediaRatio === "4:5" ||
        pc?.mediaRatio === "1:1" ||
        pc?.mediaRatio === "16:9"
          ? pc.mediaRatio
          : D.productCard.mediaRatio,
      badgePosition: pc?.badgePosition === "right" ? "right" : D.productCard.badgePosition,
      showBadge: pc?.showBadge ?? D.productCard.showBadge,
      showRatings: pc?.showRatings ?? D.productCard.showRatings,
      showDept: pc?.showDept ?? D.productCard.showDept,
      hoverMode: pc?.hoverMode === "image" || pc?.hoverMode === "actions" ? pc.hoverMode : D.productCard.hoverMode,
      ctaSet: (Array.isArray(pc?.ctaSet) ? pc.ctaSet : D.productCard.ctaSet)
        .filter((c): c is QuickAction => c === "quick-view" || c === "wishlist" || c === "add-to-cart" || c === "share")
        .slice(0, 3),
      ctaPosition:
        pc?.ctaPosition === "left" || pc?.ctaPosition === "right" ? pc.ctaPosition : D.productCard.ctaPosition,
      showActionsOnTouch: pc?.showActionsOnTouch ?? D.productCard.showActionsOnTouch,
      nameSize: clampInt(pc?.nameSize, L.nameSize.min, L.nameSize.max, D.productCard.nameSize),
      priceSize: clampInt(pc?.priceSize, L.nameSize.min, L.nameSize.max, D.productCard.priceSize),
      colsDesktop: clampInt(pc?.colsDesktop, 3, 5, D.productCard.colsDesktop),
      colsTablet: clampInt(pc?.colsTablet, 2, 3, D.productCard.colsTablet),
      colsPhone: clampInt(pc?.colsPhone, 1, 2, D.productCard.colsPhone),
    },
  };
}
