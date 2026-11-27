import type { GridMode } from "@/lib/shop/machine";

export type { GridMode } from "@/lib/shop/machine";

/**
 * Shop chrome resolvers — sf-087. Pure.
 *
 * Defaults live here and nowhere else. Flat props beat the options object,
 * absent means inherit, and numerics clamp before they reach CSS. The styling
 * sheet mirrors these fallbacks so the same value is legible in both places.
 */

export type SegmentedSize = "sm" | "md";

export interface SegmentedOption {
  value: string;
  label: string;
  /** Decorative glyph name from the Icon map; never a hex value. */
  icon?: string;
}

export interface SegmentedToggleOptions {
  options?: readonly SegmentedOption[];
  size?: SegmentedSize;
  ariaLabel?: string;
  /** Cap is clamped to 1–6 so a wider set cannot break the shell grid. */
  maxOptions?: number;
}

export interface ResolvedSegmentedToggle {
  options: readonly SegmentedOption[];
  size: SegmentedSize;
  ariaLabel: string;
}

export const DEFAULT_SEGMENTED_TOGGLE = {
  size: "md" as SegmentedSize,
  ariaLabel: "Choose a view",
  maxOptions: 6,
  options: [] as readonly SegmentedOption[],
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

export function resolveSegmentedToggle(
  options: SegmentedToggleOptions | undefined,
  flat: { options?: readonly SegmentedOption[]; size?: SegmentedSize; ariaLabel?: string } = {},
): ResolvedSegmentedToggle {
  const source = options ?? DEFAULT_SEGMENTED_TOGGLE;
  const limit = clamp(
    source.maxOptions ?? DEFAULT_SEGMENTED_TOGGLE.maxOptions,
    1,
    6,
  );
  return {
    options: (flat.options ?? source.options ?? DEFAULT_SEGMENTED_TOGGLE.options).slice(0, limit),
    size: flat.size ?? source.size ?? DEFAULT_SEGMENTED_TOGGLE.size,
    ariaLabel: flat.ariaLabel ?? source.ariaLabel ?? DEFAULT_SEGMENTED_TOGGLE.ariaLabel,
  };
}

export type MenuAlign = "start" | "end";

export interface ResolvedMenu {
  align: MenuAlign;
  ariaLabel: string;
}

export const DEFAULT_MENU = { align: "start" as MenuAlign, ariaLabel: "Menu" };

export function resolveMenu(
  options: { align?: MenuAlign; ariaLabel?: string } | undefined,
  flat: { align?: MenuAlign; ariaLabel?: string } = {},
): ResolvedMenu {
  const source = options ?? DEFAULT_MENU;
  return {
    align: flat.align ?? source.align ?? DEFAULT_MENU.align,
    ariaLabel: flat.ariaLabel ?? source.ariaLabel ?? DEFAULT_MENU.ariaLabel,
  };
}

export type DrawerSide = "left" | "right";

export interface ResolvedFilterDrawer {
  side: DrawerSide;
  title: string;
  /** Width in px; clamped so a narrow phone always keeps a visible scrim. */
  width: number;
}

export const DEFAULT_FILTER_DRAWER = {
  side: "left" as DrawerSide,
  title: "Filters",
  width: 320,
};

export function resolveFilterDrawer(
  options: { side?: DrawerSide; title?: string; width?: number } | undefined,
  flat: { side?: DrawerSide; title?: string; width?: number } = {},
): ResolvedFilterDrawer {
  const source = options ?? DEFAULT_FILTER_DRAWER;
  return {
    side: flat.side ?? source.side ?? DEFAULT_FILTER_DRAWER.side,
    title: flat.title ?? source.title ?? DEFAULT_FILTER_DRAWER.title,
    width: clamp(
      flat.width ?? source.width ?? DEFAULT_FILTER_DRAWER.width,
      240,
      480,
    ),
  };
}

export interface ResolvedShopToolbar {
  resultLabel: string;
  showCount: boolean;
}

export const DEFAULT_SHOP_TOOLBAR = { resultLabel: "results", showCount: true };

export function resolveShopToolbar(
  options: { resultLabel?: string; showCount?: boolean } | undefined,
  flat: { resultLabel?: string; showCount?: boolean } = {},
): ResolvedShopToolbar {
  const source = options ?? DEFAULT_SHOP_TOOLBAR;
  return {
    resultLabel: flat.resultLabel ?? source.resultLabel ?? DEFAULT_SHOP_TOOLBAR.resultLabel,
    showCount: flat.showCount ?? source.showCount ?? DEFAULT_SHOP_TOOLBAR.showCount,
  };
}

/**
 * A grid-mode string from the URL/owner becomes one of the two known faces.
 * Junk is a default, never a guess at intent — the same rule as listing sort.
 */
export function parseGridMode(value: unknown): GridMode {
  return value === "one" ? "one" : "two";
}
