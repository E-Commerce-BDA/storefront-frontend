import type { CardVariant, ProductCardData } from "./productCard";

export interface ResolvedQuickView {
  matchedVariant: CardVariant | null;
  variantId?: string;
  price: number;
  compareAt?: number | null;
  imageUrl: string;
  inStock: boolean;
}

export function getDefaultQuickViewOptions(product: ProductCardData): Record<string, string> {
  if (product.cardVariants && product.cardVariants.length > 0) {
    // Prefer the first in-stock variant
    const inStock = product.cardVariants.find((v) => v.stock > 0);
    const chosen = inStock ?? product.cardVariants[0];
    if (chosen && chosen.optionValues) {
      return { ...chosen.optionValues };
    }
  }

  if (product.options && product.options.length > 0) {
    const defaults: Record<string, string> = {};
    for (const opt of product.options) {
      if (opt.values && opt.values.length > 0) {
        defaults[opt.name] = opt.values[0].value;
      }
    }
    return defaults;
  }

  return {};
}

export function resolveQuickViewSelection(
  product: ProductCardData,
  selectedOptions: Record<string, string>,
): ResolvedQuickView {
  let matchedVariant: CardVariant | null = null;

  if (product.cardVariants && product.cardVariants.length > 0) {
    matchedVariant =
      product.cardVariants.find((v) => {
        if (!v.optionValues) return false;
        return Object.entries(selectedOptions).every(
          ([key, val]) => v.optionValues[key] === val,
        );
      }) ?? null;
  }

  const price = matchedVariant?.price ?? product.price;
  const compareAt = matchedVariant?.compareAtPrice ?? product.compareAt ?? null;
  const imageUrl =
    matchedVariant?.imageUrl ||
    product.image ||
    (product as { imageUrl?: string }).imageUrl ||
    (product.images && product.images[0]?.url) ||
    "";
  const inStock = matchedVariant
    ? matchedVariant.stock > 0
    : product.stock !== "out";

  return {
    matchedVariant,
    variantId: matchedVariant?.id,
    price,
    compareAt,
    imageUrl,
    inStock,
  };
}
