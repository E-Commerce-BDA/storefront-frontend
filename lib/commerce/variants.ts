/**
 * Variant selection — sf-051
 * (product.md §14, routing.md §4: the island owns `selected`, this file decides
 * what is selectable)
 *
 * A selection is `{ [option name]: option value id }`. **Names**, not option
 * ids, because the URL speaks slugs (`?color=blue&size=m`) and the fixed key
 * order in routing.md §4 is a name order — one vocabulary from the service to
 * the address bar, no lookup table to keep in sync.
 *
 * Two rules carry the weight:
 *
 * 1. **Impossible values are disabled, never removed.** Removing a swatch
 *    reflows the row under the shopper's cursor — they tap "Navy" and land on
 *    "Black". `selectionOptions` marks each value `available` instead, and the
 *    block renders it `aria-disabled`.
 * 2. **Availability is cross-option.** "Red is out of stock *in size M*" is the
 *    actual shopping failure; a flat "any in-stock variant carries red" would
 *    happily offer the dead end. So each option is judged against the rest of
 *    the selection — with one escape hatch: if that combination matches nothing
 *    at all, availability falls back to the plain rule, or the shopper would be
 *    locked inside a dead end with every other value greyed out.
 */

import type { ProductOptionDto, ProductVariantDto } from "@/lib/catalog/schemas";

/** Option name → option value id. */
export type VariantSelection = Record<string, string>;

export interface VariantValueView {
  id: string;
  /** Display label ("Ocean Blue"). */
  value: string;
  swatchHex: string | null;
  swatchImageUrl: string | null;
  /** Carried by a purchasable variant that fits the rest of the selection. */
  available: boolean;
}

export interface VariantOptionView {
  id: string;
  name: string;
  displayType: "text" | "pill" | "swatch";
  values: VariantValueView[];
}

/** In stock and not retired — the only rows worth offering. */
export function isPurchasable(variant: ProductVariantDto): boolean {
  return variant.stock > 0 && variant.isActive !== false;
}

/** The value id one variant carries for an option, or null when it does not. */
function valueOf(variant: ProductVariantDto, optionName: string): string | null {
  const match = variant.options.find((entry) => entry.optionName === optionName);
  return match ? match.optionValueId : null;
}

/** True when every chosen value matches this variant (a partial selection fits broadly). */
export function selectionFits(
  selection: VariantSelection,
  variant: ProductVariantDto,
): boolean {
  return Object.entries(selection).every(
    ([optionName, valueId]) => valueOf(variant, optionName) === valueId,
  );
}

/**
 * The variant a selection names. Purchasable wins over "exists but sold out", so
 * a product with a restocked duplicate does not advertise the dead one; if the
 * only match is sold out it is still returned — the panel must show *that*
 * variant's price and a sold-out state, not a different variant's.
 */
export function resolveVariant(
  variants: readonly ProductVariantDto[],
  selection: VariantSelection,
): ProductVariantDto | null {
  const fits = variants.filter((variant) => selectionFits(selection, variant));
  return fits.find(isPurchasable) ?? fits[0] ?? null;
}

/**
 * Opening selection: the first purchasable variant, else the first one, else
 * empty (a product without variants sells itself).
 */
export function defaultSelection(
  options: readonly ProductOptionDto[],
  variants: readonly ProductVariantDto[],
): VariantSelection {
  const covers = (variant: ProductVariantDto) =>
    options.every((option) => valueOf(variant, option.name) !== null);

  const variant =
    variants.find((row) => isPurchasable(row) && covers(row)) ??
    variants.find(covers) ??
    null;
  if (variant === null) return {};

  const selection: VariantSelection = {};
  for (const option of orderedOptions(options)) {
    const valueId = valueOf(variant, option.name);
    if (valueId !== null) selection[option.name] = valueId;
  }
  return selection;
}

/** `position` ascending, ties keep the service's order — the URL key order. */
export function orderedOptions(
  options: readonly ProductOptionDto[],
): ProductOptionDto[] {
  return [...options].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
}

/**
 * What the selector renders: every option, every value, each marked
 * `available` against the rest of the current selection.
 */
export function selectionOptions(
  options: readonly ProductOptionDto[],
  variants: readonly ProductVariantDto[],
  selection: VariantSelection,
): VariantOptionView[] {
  const purchasable = variants.filter(isPurchasable);

  return orderedOptions(options).map((option) => {
    const others = Object.entries(selection).filter(([name]) => name !== option.name);
    const fitted = purchasable.filter((variant) =>
      others.every(([name, valueId]) => valueOf(variant, name) === valueId),
    );
    // Dead end → fall back to the plain rule so the shopper can escape it.
    const pool = fitted.length > 0 ? fitted : purchasable;
    const offered = new Set(
      pool
        .map((variant) => valueOf(variant, option.name))
        .filter((valueId): valueId is string => valueId !== null),
    );

    return {
      id: option.id,
      name: option.name,
      displayType: option.displayType,
      values: [...option.values]
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
        .map((value) => ({
          id: value.id,
          value: value.value,
          swatchHex: value.swatchHex ?? null,
          swatchImageUrl: value.swatchImageUrl ?? null,
          available: offered.has(value.id),
        })),
    };
  });
}
