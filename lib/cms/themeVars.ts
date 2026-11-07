/**
 * Theme → CSS variables — pure mapping.
 *
 * The root layout emits these variables only when a resolved theme value
 * differs from `DEFAULT_THEME`. That is the zero-visual-change invariant:
 * with no admin theme (or a `null` theme read), the output is `{}` and every
 * component renders from its existing CSS fallbacks. Empty-string colors are
 * the theme vocabulary's "no override" sentinel and are never emitted.
 */

import type { CSSProperties } from "react";
import { DEFAULT_THEME, type ResolvedThemeSettings } from "./themeSettings";

type Vars = Record<string, string | number>;

function setString(vars: Vars, key: string, value: string, fallback: string): void {
  if (value !== "" && value !== fallback) vars[key] = value;
}

function setNumber(vars: Vars, key: string, value: number, fallback: number): void {
  if (value !== fallback) vars[key] = value;
}

export function themeToCssVars(theme: ResolvedThemeSettings): CSSProperties {
  const vars: Vars = {};
  const d = DEFAULT_THEME;

  setString(vars, "--theme-btn-bg", theme.button.bg, d.button.bg);
  setString(vars, "--theme-btn-text", theme.button.textColor, d.button.textColor);
  setString(vars, "--theme-btn-border", theme.button.borderColor, d.button.borderColor);
  setNumber(vars, "--theme-btn-radius", theme.button.borderRadius, d.button.borderRadius);

  setString(vars, "--theme-input-bg", theme.input.bg, d.input.bg);
  setString(vars, "--theme-input-text", theme.input.textColor, d.input.textColor);
  setString(vars, "--theme-input-border", theme.input.borderColor, d.input.borderColor);
  setString(vars, "--theme-input-focus-border", theme.input.focusBorderColor, d.input.focusBorderColor);
  setNumber(vars, "--theme-input-radius", theme.input.borderRadius, d.input.borderRadius);

  setNumber(vars, "--theme-checkbox-size", theme.checkbox.size, d.checkbox.size);
  setString(vars, "--theme-checkbox-bg", theme.checkbox.boxBg, d.checkbox.boxBg);
  setString(vars, "--theme-checkbox-tick", theme.checkbox.tickColor, d.checkbox.tickColor);
  setString(vars, "--theme-checkbox-border", theme.checkbox.borderColor, d.checkbox.borderColor);
  setNumber(vars, "--theme-checkbox-radius", theme.checkbox.borderRadius, d.checkbox.borderRadius);

  setNumber(vars, "--theme-toggle-width", theme.toggle.width, d.toggle.width);
  setNumber(vars, "--theme-toggle-height", theme.toggle.height, d.toggle.height);
  setString(vars, "--theme-toggle-on", theme.toggle.onColor, d.toggle.onColor);
  setString(vars, "--theme-toggle-off", theme.toggle.offColor, d.toggle.offColor);
  setString(vars, "--theme-toggle-knob", theme.toggle.knobColor, d.toggle.knobColor);

  setNumber(vars, "--theme-icon-size", theme.icon.size, d.icon.size);
  setNumber(vars, "--theme-icon-stroke", theme.icon.strokeWidth, d.icon.strokeWidth);
  setString(vars, "--theme-icon-color", theme.icon.color, d.icon.color);

  setString(vars, "--theme-textarea-bg", theme.textarea.bg, d.textarea.bg);
  setString(vars, "--theme-textarea-text", theme.textarea.textColor, d.textarea.textColor);
  setString(vars, "--theme-textarea-border", theme.textarea.borderColor, d.textarea.borderColor);
  setString(vars, "--theme-textarea-focus-border", theme.textarea.focusBorderColor, d.textarea.focusBorderColor);
  setNumber(vars, "--theme-textarea-radius", theme.textarea.borderRadius, d.textarea.borderRadius);

  setString(vars, "--theme-select-bg", theme.select.bg, d.select.bg);
  setString(vars, "--theme-select-text", theme.select.textColor, d.select.textColor);
  setString(vars, "--theme-select-border", theme.select.borderColor, d.select.borderColor);
  setString(vars, "--theme-select-focus-border", theme.select.focusBorderColor, d.select.focusBorderColor);
  setNumber(vars, "--theme-select-radius", theme.select.borderRadius, d.select.borderRadius);
  setString(vars, "--theme-select-selected-bg", theme.select.selectedBg, d.select.selectedBg);
  setString(vars, "--theme-select-selected-text", theme.select.selectedText, d.select.selectedText);
  setString(vars, "--theme-select-hover-bg", theme.select.hoverBg, d.select.hoverBg);
  setString(vars, "--theme-select-hover-text", theme.select.hoverText, d.select.hoverText);
  setNumber(vars, "--theme-select-option-padding-y", theme.select.optionPaddingY, d.select.optionPaddingY);
  setNumber(vars, "--theme-select-arrow-padding", theme.select.arrowPadding, d.select.arrowPadding);

  setString(vars, "--theme-tooltip-bg", theme.tooltip.bg, d.tooltip.bg);
  setString(vars, "--theme-tooltip-text", theme.tooltip.textColor, d.tooltip.textColor);
  setString(vars, "--theme-tooltip-border", theme.tooltip.borderColor, d.tooltip.borderColor);
  setNumber(vars, "--theme-tooltip-border-width", theme.tooltip.borderWidth, d.tooltip.borderWidth);
  setNumber(vars, "--theme-tooltip-radius", theme.tooltip.radius, d.tooltip.radius);
  setNumber(vars, "--theme-tooltip-font-size", theme.tooltip.fontSize, d.tooltip.fontSize);
  setNumber(vars, "--theme-tooltip-font-weight", theme.tooltip.fontWeight, d.tooltip.fontWeight);
  setNumber(vars, "--theme-tooltip-duration", theme.tooltip.durationMs, d.tooltip.durationMs);
  setNumber(vars, "--theme-tooltip-offset", theme.tooltip.offset, d.tooltip.offset);

  setString(vars, "--theme-dialog-overlay", theme.dialog.overlayColor, d.dialog.overlayColor);
  setNumber(vars, "--theme-dialog-overlay-alpha", theme.dialog.overlayAlpha, d.dialog.overlayAlpha);
  setString(vars, "--theme-dialog-panel-bg", theme.dialog.panelBg, d.dialog.panelBg);
  setString(vars, "--theme-dialog-border", theme.dialog.borderColor, d.dialog.borderColor);
  setNumber(vars, "--theme-dialog-radius", theme.dialog.borderRadius, d.dialog.borderRadius);
  setNumber(vars, "--theme-dialog-max-width", theme.dialog.maxWidth, d.dialog.maxWidth);
  setString(vars, "--theme-dialog-title-color", theme.dialog.titleColor, d.dialog.titleColor);
  setNumber(vars, "--theme-dialog-title-size", theme.dialog.titleSize, d.dialog.titleSize);
  setNumber(vars, "--theme-dialog-body-size", theme.dialog.bodySize, d.dialog.bodySize);
  setNumber(vars, "--theme-dialog-body-weight", theme.dialog.bodyWeight, d.dialog.bodyWeight);
  setString(vars, "--theme-dialog-body-color", theme.dialog.bodyColor, d.dialog.bodyColor);

  setNumber(vars, "--theme-productcard-cols-desktop", theme.productCard.colsDesktop, d.productCard.colsDesktop);
  setNumber(vars, "--theme-productcard-cols-tablet", theme.productCard.colsTablet, d.productCard.colsTablet);
  setNumber(vars, "--theme-productcard-cols-phone", theme.productCard.colsPhone, d.productCard.colsPhone);

  return vars as CSSProperties;
}
