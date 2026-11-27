/**
 * Palette → CSS custom properties — pure emitter (sf-084).
 *
 * The semantic `--sf-color-*` / `--sf-state-*` / `--sf-radius-*` / `--sf-type-*`
 * tokens carry concrete effective values. Component token defaults are
 * `var()` references into those semantics, and the legacy `--color-*` names
 * alias the new tokens for one release so existing components keep painting
 * while they migrate. No raw admin text and no empty sentinel reach CSS.
 *
 * Rejected: emitting only changed values — a body-level var map must be
 * complete and deterministic, or a route that overrides one key could leave a
 * sibling key resolving against a stale ancestor.
 */

import { themeVarsSchema } from "@ecom/contracts";
import {
  DEFAULT_PALETTE,
  defaultComponentGroups,
  type ResolvedComponentGroups,
  type ResolvedPalette,
} from "./palette";

export type ThemeVars = Record<string, string | number>;

const SEMANTIC_VARS: ReadonlyArray<[keyof ResolvedPalette, string]> = [
  ["brand", "--sf-color-brand"],
  ["brandHover", "--sf-color-brand-hover"],
  ["onBrand", "--sf-color-on-brand"],
  ["brandWash", "--sf-color-brand-wash"],
  ["ink", "--sf-color-ink"],
  ["muted", "--sf-color-muted"],
  ["border", "--sf-color-border"],
  ["surface", "--sf-color-surface"],
  ["surfaceSunken", "--sf-color-surface-sunken"],
  ["surfaceRaised", "--sf-color-surface-raised"],
  ["imagePlaceholder", "--sf-color-image-placeholder"],
  ["saleFill", "--sf-color-sale-fill"],
  ["saleText", "--sf-color-sale-text"],
  ["saleWash", "--sf-color-sale-wash"],
  ["onSale", "--sf-color-on-sale"],
  ["successFill", "--sf-color-success"],
  ["successFg", "--sf-color-success-fg"],
  ["successBg", "--sf-color-success-bg"],
  ["successBorder", "--sf-color-success-border"],
  ["onSuccess", "--sf-color-on-success"],
  ["warningFill", "--sf-color-warning"],
  ["warningFg", "--sf-color-warning-fg"],
  ["warningBg", "--sf-color-warning-bg"],
  ["warningBorder", "--sf-color-warning-border"],
  ["onWarning", "--sf-color-on-warning"],
  ["errorFill", "--sf-color-error"],
  ["errorFg", "--sf-color-error-fg"],
  ["errorBg", "--sf-color-error-bg"],
  ["errorBorder", "--sf-color-error-border"],
  ["onError", "--sf-color-on-error"],
  ["navbarBg", "--sf-color-navbar-bg"],
  ["navbarText", "--sf-color-navbar-text"],
  ["navbarHover", "--sf-color-navbar-hover"],
  ["navbarBadgeBg", "--sf-color-navbar-badge-bg"],
  ["navbarBadgeText", "--sf-color-navbar-badge-text"],
  ["navbarAnnounceBg", "--sf-color-navbar-announce-bg"],
  ["navbarAnnounceText", "--sf-color-navbar-announce-text"],
  ["footerBg", "--sf-color-footer-bg"],
  ["footerText", "--sf-color-footer-text"],
  ["footerLink", "--sf-color-footer-link"],
  ["footerHover", "--sf-color-footer-hover"],
  ["scrimSoft", "--sf-color-scrim-soft"],
  ["scrimPanel", "--sf-color-scrim-panel"],
  ["scrimStrong", "--sf-color-scrim-strong"],
];

const STATE_VARS: ReadonlyArray<[keyof ResolvedPalette, string]> = [
  ["focusOutline", "--sf-state-focus-outline"],
  ["focusHalo", "--sf-state-focus-halo"],
  ["disabledBg", "--sf-state-disabled-bg"],
  ["disabledText", "--sf-state-disabled-text"],
  ["disabledBorder", "--sf-state-disabled-border"],
];

/** Component defaults point at semantics; only the emitter owns these refs. */
const COMPONENT_VARS: ReadonlyArray<[string, string]> = [
  ["--sf-comp-button-bg", "var(--sf-color-brand)"],
  ["--sf-comp-button-text", "var(--sf-color-on-brand)"],
  ["--sf-comp-button-hover-bg", "var(--sf-color-brand-hover)"],
  ["--sf-comp-button-light-bg", "var(--sf-color-surface)"],
  ["--sf-comp-button-light-text", "var(--sf-color-brand)"],
  ["--sf-comp-badge-bg", "var(--sf-color-brand)"],
  ["--sf-comp-badge-text", "var(--sf-color-on-brand)"],
  ["--sf-comp-link", "var(--sf-color-ink)"],
  ["--sf-comp-link-hover", "var(--sf-color-navbar-hover)"],
  ["--sf-comp-panel", "var(--sf-color-surface-raised)"],
  ["--sf-comp-panel-text", "var(--sf-color-ink)"],
  ["--sf-comp-panel-border", "var(--sf-color-border)"],
  ["--sf-comp-announce-bg", "var(--sf-color-navbar-announce-bg)"],
  ["--sf-comp-announce-text", "var(--sf-color-navbar-announce-text)"],
  ["--sf-comp-footer-bg", "var(--sf-color-footer-bg)"],
  ["--sf-comp-footer-text", "var(--sf-color-footer-text)"],
  ["--sf-comp-footer-link", "var(--sf-color-footer-link)"],
  ["--sf-comp-footer-hover", "var(--sf-color-footer-hover)"],
];

/** One-release aliases. Every value is a reference, never a second literal. */
const LEGACY_VARS: ReadonlyArray<[string, string]> = [
  ["--color-navbar-bg", "var(--sf-color-navbar-bg)"],
  ["--color-navbar-text", "var(--sf-color-navbar-text)"],
  ["--color-ink", "var(--sf-color-ink)"],
  ["--color-accent", "var(--sf-color-brand)"],
  ["--color-accent-hover", "var(--sf-color-brand-hover)"],
  ["--color-accent-50", "var(--sf-color-brand-wash)"],
  ["--color-button-bg", "var(--sf-color-brand)"],
  ["--color-button-text", "var(--sf-color-on-brand)"],
  ["--color-button-light-bg", "var(--sf-color-surface)"],
  ["--color-button-light-text", "var(--sf-color-brand)"],
  ["--color-section-bg", "var(--sf-color-surface-sunken)"],
  ["--color-image-bg", "var(--sf-color-image-placeholder)"],
  ["--color-sale", "var(--sf-color-sale-fill)"],
  ["--color-sale-soft", "var(--sf-color-sale-wash)"],
  ["--color-sale-text", "var(--sf-color-sale-text)"],
  ["--color-success", "var(--sf-color-success)"],
  ["--color-success-bg", "var(--sf-color-success-bg)"],
  ["--color-success-border", "var(--sf-color-success-border)"],
  ["--color-on-success", "var(--sf-color-on-success)"],
  ["--color-warning", "var(--sf-color-warning)"],
  ["--color-warning-bg", "var(--sf-color-warning-bg)"],
  ["--color-warning-border", "var(--sf-color-warning-border)"],
  ["--color-error", "var(--sf-color-error)"],
  ["--color-error-bg", "var(--sf-color-error-bg)"],
  ["--color-error-border", "var(--sf-color-error-border)"],
  ["--border", "var(--sf-color-border)"],
  ["--text-muted", "var(--sf-color-muted)"],
  ["--focus-ring", "var(--sf-state-focus-halo)"],
  ["--surface-disabled", "var(--sf-state-disabled-bg)"],
  ["--text-disabled", "var(--sf-state-disabled-text)"],
  ["--color-surface", "var(--sf-color-surface)"],
  ["--color-navy", "var(--sf-color-ink)"],
  ["--color-on-navy", "var(--sf-color-on-brand)"],
  ["--surface-base", "var(--sf-color-surface-sunken)"],
  ["--surface-raised", "var(--sf-color-surface-raised)"],
  ["--surface-hover", "var(--sf-color-brand-wash)"],
  ["--surface-muted", "var(--sf-color-image-placeholder)"],
  ["--scrim", "var(--sf-color-scrim-panel)"],
  ["--radius-button", "var(--sf-radius-button)"],
  ["--radius-card", "var(--sf-radius-card)"],
  ["--radius-sm", "var(--sf-radius-sm)"],
  ["--radius-md", "var(--sf-radius-md)"],
];

/**
 * Component groups onto the families the stylesheet already reads.
 * Strip paint comes from semantics (one definition per family); the marquee
 * clock is calibrated so the builtin 60 px/s keeps the shipped 30 s fallback
 * instead of changing every strip the moment this token is emitted.
 */
export function componentGroupsToThemeVars(groups: ResolvedComponentGroups): ThemeVars {
  const vars: ThemeVars = {};
  vars["--nb-height"] = `${groups.navbarHeight}px`;
  vars["--nb-bg"] = groups.navbarBg;
  vars["--nb-text"] = groups.navbarText;
  vars["--nb-hover"] = groups.navbarHover;
  vars["--nb-badge-bg"] = groups.navbarBadgeBg;
  vars["--nb-badge-text"] = groups.navbarBadgeText;
  vars["--nb-announce-bg"] = groups.navbarAnnounceBg;
  vars["--nb-announce-text"] = groups.navbarAnnounceText;

  vars["--facet-bg"] = groups.facetBg;
  vars["--facet-border"] = groups.facetBorder;
  vars["--facet-title"] = groups.facetTitle;
  vars["--facet-label"] = groups.facetLabel;
  vars["--facet-gap"] = `${groups.facetGap}px`;
  vars["--facet-pad"] = `${groups.facetPad}px`;
  vars["--facet-radius"] = `${groups.facetRadius}px`;
  vars["--facet-action-gap"] = `${groups.facetActionGap}px`;
  vars["--facet-max-height"] = `${groups.facetMaxHeight}px`;
  vars["--facet-head-gap"] = `${groups.facetHeadGap}px`;
  vars["--facet-title-size"] = `${groups.facetTitleSize}px`;
  vars["--facet-inner-gap"] = `${groups.facetInnerGap}px`;
  vars["--facet-label-size"] = `${groups.facetLabelSize}px`;
  vars["--facet-price-gap"] = `${groups.facetPriceGap}px`;
  vars["--facet-tag-gap"] = `${groups.facetTagGap}px`;
  vars["--facet-tag-max"] = `${groups.facetTagMax}px`;

  vars["--minicart-bg"] = groups.drawerBg;
  vars["--minicart-title"] = groups.drawerText;
  vars["--minicart-subtotal"] = groups.drawerText;
  vars["--minicart-border"] = groups.drawerBorderColor;
  vars["--minicart-scrim"] = groups.drawerOverlayColor;
  vars["--minicart-width"] = `${groups.drawerWidth}px`;
  vars["--minicart-pad"] = "20px";
  vars["--minicart-duration"] = `${groups.drawerDurationMs}ms`;
  vars["--minicart-motion"] = groups.drawerMotion;

  vars["--strip-cell-bg"] = "var(--sf-color-surface)";
  vars["--strip-cell-border"] = "var(--sf-color-border)";
  vars["--strip-wordmark"] = "var(--sf-color-ink)";
  vars["--strip-cell-radius"] = "var(--sf-radius-card)";
  const seconds = Math.min(240, Math.max(4, Number((1800 / groups.marqueeSpeed).toFixed(2))));
  const builtin = defaultComponentGroups(DEFAULT_PALETTE);
  // These two families carry per-section fallbacks of 16/20/32px and 30/40s.
  // Emitting a global value at the builtin would silently restyle sections that
  // have no inline override, so they are emitted only when admin actually
  // retunes them; CSS keeps its own fallbacks otherwise.
  if (seconds !== 30) vars["--marquee-duration"] = `${seconds}s`;
  vars["--marquee-direction"] = groups.marqueeDirection === "right" ? "reverse" : "normal";
  vars["--marquee-play-state"] = groups.marqueePauseOnHover ? "paused" : "running";
  if (groups.gridGap !== builtin.gridGap) vars["--grid-gap"] = `${groups.gridGap}px`;

  vars["--pc-cta-bg"] = groups.pcCtaBg;
  vars["--pc-cta-text"] = groups.pcCtaText;
  vars["--pc-cta-border"] = groups.pcCtaBorder;
  return vars;
}

/** Every emitted key has a fallback mirror in `app/globals.css :root`. */
export function paletteToThemeVars(
  palette: ResolvedPalette,
  groups?: ResolvedComponentGroups,
): ThemeVars {
  const vars: ThemeVars = {};
  for (const [key, name] of SEMANTIC_VARS) vars[name] = palette[key];
  for (const [key, name] of STATE_VARS) vars[name] = palette[key];
  vars["--sf-radius-button"] = `${palette.radiusButton}px`;
  vars["--sf-radius-card"] = `${palette.radiusCard}px`;
  vars["--sf-radius-sm"] = `${palette.radiusSm}px`;
  vars["--sf-radius-md"] = `${palette.radiusMd}px`;
  // Legacy --fs-* names keep their clamp(): aliasing them to these concrete
  // numbers would freeze responsive display type. They migrate separately.
  vars["--sf-type-font-sans"] = palette.fontSans;
  vars["--sf-type-font-display"] = palette.fontDisplay;
  vars["--sf-type-fs-display-1"] = `${palette.fsDisplay1}px`;
  vars["--sf-type-fs-display-2"] = `${palette.fsDisplay2}px`;
  vars["--sf-type-fs-display-3"] = `${palette.fsDisplay3}px`;
  vars["--sf-type-fs-body"] = `${palette.fsBody}px`;
  vars["--sf-type-fs-caption"] = `${palette.fsCaption}px`;
  for (const [name, ref] of COMPONENT_VARS) vars[name] = ref;
  for (const [name, ref] of LEGACY_VARS) vars[name] = ref;
  if (groups) Object.assign(vars, componentGroupsToThemeVars(groups));

  // Contracts 2.2.0 gates the wire shape; a failure here is an emitter bug,
  // not bad admin input (the resolver already rejected bad values).
  const parsed = themeVarsSchema.safeParse(vars);
  if (!parsed.success) throw new Error("paletteToThemeVars: invalid CSS var map");
  return parsed.data;
}
