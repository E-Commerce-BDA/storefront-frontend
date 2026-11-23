/**
 * Variant URL codec — sf-055 (routing.md §4)
 *
 * The address bar speaks option **names** and value **slugs**, never ids; the
 * pure rules here own both directions so the client hook never re-decides the
 * key order (fixed, by option `position`) or what "nearest in-stock" means.
 *
 * - `selectionFromQuery`: URL → value-id selection. An unknown key is ignored.
 *   A selection that resolves to a sold-out or impossible combination is
 *   repaired to the purchasable variant sharing the most chosen values, with
 *   `rewritten: true` so the caller can replace the URL quietly.
 * - `selectionToQuery`: selection → canonical query string, keys in fixed
 *   option order so one variant has exactly one URL.
 */

import type { ProductOptionDto, ProductVariantDto } from "@/lib/catalog/schemas";
import {
  defaultSelection,
  isPurchasable,
  orderedOptions,
  resolveVariant,
  type VariantSelection,
} from "./variants";

export interface ParsedVariantQuery {
  selection: VariantSelection;
  rewritten: boolean;
}

export function valueSlug(label: string): string {
  return label
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function valueIdForToken(
  option: ProductOptionDto,
  token: string,
): string | undefined {
  return option.values.find((value) => valueSlug(value.value) === token)?.id;
}

function selectionOfVariant(
  variant: ProductVariantDto,
  options: readonly ProductOptionDto[],
): VariantSelection {
  const selection: VariantSelection = {};
  for (const entry of variant.options) {
    selection[entry.optionName] = entry.optionValueId;
  }
  const known = new Set(options.map((option) => option.name));
  return Object.fromEntries(
    Object.entries(selection).filter(([name]) => known.has(name)),
  );
}

function nearestPurchasable(
  variants: readonly ProductVariantDto[],
  selection: VariantSelection,
): ProductVariantDto | null {
  const chosen = Object.entries(selection);
  if (chosen.length === 0) return null;
  let best: ProductVariantDto | null = null;
  let bestScore = -1;
  for (const variant of variants) {
    if (!isPurchasable(variant)) continue;
    const score = chosen.filter(([name, id]) =>
      variant.options.some(
        (entry) => entry.optionName === name && entry.optionValueId === id,
      ),
    ).length;
    if (score > bestScore) {
      best = variant;
      bestScore = score;
    }
  }
  return best;
}

export function selectionFromQuery(
  params: URLSearchParams,
  options: readonly ProductOptionDto[],
  variants: readonly ProductVariantDto[],
): ParsedVariantQuery {
  const ordered = orderedOptions(options);
  if (ordered.length === 0) return { selection: {}, rewritten: false };

  const selection: VariantSelection = {};
  let unknownKey = false;
  for (const option of ordered) {
    const token = params.get(option.name);
    if (token === null || token.trim() === "") continue;
    const id = valueIdForToken(option, token.trim());
    if (id === undefined) {
      unknownKey = true;
      continue;
    }
    selection[option.name] = id;
  }

  if (Object.keys(selection).length === 0) {
    return { selection: defaultSelection(options, variants), rewritten: false };
  }

  // An unknown token is never silently kept: repair to the nearest in-stock
  // variant (or the builtin default when nothing is purchasable).
  if (unknownKey) {
    const nearest = nearestPurchasable(variants, selection);
    return {
      selection: nearest
        ? selectionOfVariant(nearest, ordered)
        : defaultSelection(options, variants),
      rewritten: true,
    };
  }

  const resolved = resolveVariant(variants, selection);
  if (resolved !== null && isPurchasable(resolved)) {
    return { selection, rewritten: false };
  }

  const nearest = nearestPurchasable(variants, selection);
  return {
    selection: nearest
      ? selectionOfVariant(nearest, ordered)
      : defaultSelection(options, variants),
    rewritten: true,
  };
}

export function selectionToQuery(
  selection: VariantSelection,
  options: readonly ProductOptionDto[],
): string {
  const sp = new URLSearchParams();
  for (const option of orderedOptions(options)) {
    const id = selection[option.name];
    if (id === undefined) continue;
    const value = option.values.find((entry) => entry.id === id);
    if (value === undefined) continue;
    sp.set(option.name, valueSlug(value.value));
  }
  return sp.toString();
}
