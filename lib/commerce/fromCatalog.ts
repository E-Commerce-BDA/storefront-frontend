/**
 * Catalog → product card — sf-051
 * (product.md §11 + §15: the card is dumb, the shape is not)
 *
 * `ProductCardData` grew from search's `SearchResult`; catalog-svc answers a
 * different shape again (`ProductListItemDto` on a listing page,
 * `ProductDetailDto` on a PDP). This file is the **only** place allowed to know
 * both, so a route passes a mapper instead of re-deciding the same five rules
 * per page, and the card never grows a `??` chain to survive upstream.
 *
 * Rules that are decisions, not translations:
 *
 * 1. **The displayed price is `effectivePrice ?? price`.** cart-svc snapshots
 *    the same field (ADR 27), so a grid and the cart cannot disagree about what
 *    an item costs — a card that quoted the list price would surprise the
 *    shopper at checkout.
 * 2. **`compareAt` renders only when it is above the displayed price.** A
 *    strikethrough of `25` beside a price of `25` is a sale that does not exist.
 * 3. **One stock vocabulary.** `in|low|out` with the same cut the card's variant
 *    resolver already uses (`≤0`, `<5`, else in) — two thresholds in one face is
 *    a badge that contradicts itself when a variant is picked.
 * 4. **Money is a number.** The services parse their `DECIMAL` columns at their
 *    own DB boundary (ADR 41), so nothing here coerces; a string would be a bug
 *    to report, not a shape to absorb.
 */

import type {
  CardVariantDto,
  ProductCardBadgeDto,
  ProductCardOptionDto,
  ProductDetailDto,
  ProductImageDto,
  ProductListItemDto,
} from "@/lib/catalog/schemas";
import { orderImageRows } from "./gallery";
import type {
  CardVariant,
  ProductCardBadge,
  ProductCardData,
  ProductCardOption,
  ProductCardStyleConfig,
  ProductImageItem,
  ProductStock,
} from "./productCard";

/** A row from either catalog read — enough to paint one card. */
export type CatalogProduct = ProductListItemDto | ProductDetailDto;

const LISTING_FOLDER = "/products";

/**
 * `SearchResult.category` is required and the card paints it as the eyebrow.
 * Catalog makes it nullable, so a product with no category gets an empty
 * string — the card renders nothing for a blank one, which is the honest
 * picture. Inventing a folder name would be a lie.
 */
const CATEGORY_UNKNOWN = "";

/** Below this many units the card says "low". Same cut as the variant resolver. */
const LOW_STOCK_ABOVE = 5;

export function toProductStock(stock: number | null | undefined): ProductStock {
  if (typeof stock !== "number" || !Number.isFinite(stock) || stock <= 0) return "out";
  return stock < LOW_STOCK_ABOVE ? "low" : "in";
}

/**
 * The cover plus the carousel.
 *
 * The order is the gallery's order — `orderImageRows` is that one home — because
 * a card whose cover is the fourth photo and a PDP that opens on the first one
 * are the same product shown two ways. Rows are deduped by url for the same
 * reason the thumb rail is: a repeat cannot become a dead control. These items
 * keep `id`/`isPrimary`/`sortOrder`, which `toGalleryImages` drops, so the
 * mapping is here while the ordering rule is not restated.
 */
function toImages(
  images: readonly ProductImageDto[] | null | undefined,
  primaryImageUrl: string | null | undefined,
  name: string,
): { image: string; images?: ProductImageItem[]; hoverImage?: string } {
  const seen = new Set<string>();
  const items: ProductImageItem[] = [];
  for (const image of orderImageRows(images)) {
    if (seen.has(image.url)) continue;
    seen.add(image.url);
    items.push({
      ...(image.id !== undefined ? { id: image.id } : {}),
      url: image.url,
      alt: image.alt ?? null,
      ...(image.isPrimary !== undefined ? { isPrimary: image.isPrimary } : {}),
      ...(image.sortOrder !== undefined ? { sortOrder: image.sortOrder } : {}),
    });
  }

  if (items.length === 0) {
    // A list row's denormalised cover is the last word; with neither the card
    // paints its placeholder face, which is the truth about a photoless product.
    const only = primaryImageUrl !== null && primaryImageUrl !== undefined ? primaryImageUrl : "";
    return only === "" ? { image: "" } : { image: only };
  }

  const second = items[1];
  return {
    image: items[0]!.url,
    images: items,
    ...(second !== undefined ? { hoverImage: second.url } : {}),
  };
}

/**
 * Catalog owns badge colours wholesale (product.md §3), so the rows pass through
 * — an absent `borderColor` stays absent rather than becoming a painted border.
 */
function toBadges(
  badges: readonly ProductCardBadgeDto[] | null | undefined,
): ProductCardBadge[] | undefined {
  if (badges === undefined || badges === null || badges.length === 0) return undefined;
  return badges.map((badge) => ({
    ...(badge.id !== undefined ? { id: badge.id } : {}),
    key: badge.key,
    label: badge.label,
    bg: badge.bg,
    textColor: badge.textColor,
    ...(badge.borderColor !== null && badge.borderColor !== undefined
      ? { borderColor: badge.borderColor }
      : {}),
    ...(badge.borderStyle !== null && badge.borderStyle !== undefined
      ? { borderStyle: badge.borderStyle }
      : {}),
  }));
}

function toCardOptions(
  options: readonly ProductCardOptionDto[] | null | undefined,
): ProductCardOption[] | undefined {
  if (options === undefined || options === null || options.length === 0) return undefined;
  return options.map((option) => ({
    ...(option.id !== undefined ? { id: option.id } : {}),
    name: option.name,
    displayType: option.displayType,
    showOnCard: option.showOnCard,
    ...(option.cardPlacement !== null && option.cardPlacement !== undefined
      ? { cardPlacement: option.cardPlacement }
      : {}),
    values: option.values.map((value) => ({
      ...(value.id !== undefined ? { id: value.id } : {}),
      value: value.value,
      ...(value.position !== undefined ? { position: value.position } : {}),
      ...(value.swatchHex !== null && value.swatchHex !== undefined
        ? { swatchHex: value.swatchHex }
        : {}),
      ...(value.swatchImageUrl !== null && value.swatchImageUrl !== undefined
        ? { swatchImageUrl: value.swatchImageUrl }
        : {}),
      ...(value.inStock !== undefined ? { inStock: value.inStock } : {}),
    })),
  }));
}

/**
 * The card's compact variant rows.
 *
 * A list row arrives pre-projected (`cardVariants` already keys
 * `optionValues` by option **name** — the vocabulary
 * `resolveSelectedVariant` matches on and the URL speaks, routing.md §4), so it
 * is a relabel, not a re-derivation.
 *
 * A detail row's `variants[]` deliberately does **not** become this: a
 * `ProductVariantDto` carries a price and stock but no compare-at and no
 * per-variant media, and the card's selection effects read `imageUrl` to swap
 * the frame — inventing those would make a grid change the picture on a product
 * the PDP says looks different. The PDP has its own selector for that data
 * (`lib/commerce/variants.ts`). Recorded, not silently dropped (sf-055).
 *
 * Sold-out rows are kept: a swatch that has to render "unavailable" needs to
 * exist first — removal would reflow the row under the shopper's cursor.
 */
export function toCardVariants(
  variants: readonly CardVariantDto[] | null | undefined,
): CardVariant[] | undefined {
  if (variants === undefined || variants === null || variants.length === 0) return undefined;
  return variants.map((variant) => ({
    id: variant.id,
    sku: variant.sku,
    price: variant.price,
    stock: variant.stock,
    optionValues: variant.optionValues,
    ...(variant.compareAtPrice !== null && variant.compareAtPrice !== undefined
      ? { compareAtPrice: variant.compareAtPrice }
      : {}),
    ...(variant.imageUrl !== null && variant.imageUrl !== undefined
      ? { imageUrl: variant.imageUrl }
      : {}),
  }));
}

/**
 * Listing columns, clamped to the ranges the theme contract allows
 * (`@ecom/contracts` `themeProductCardSchema`: desktop 3–5, tablet 2–3, phone
 * 1–2). The fallbacks are `resolveThemeSettings`'s own numbers (4 / 3 / 2) — a
 * grid that guessed a fourth column would disagree with the admin panel showing
 * the shopper that setting.
 */
export const GRID_COLUMN_LIMITS = {
  desktop: { min: 3, max: 5, fallback: 4 },
  tablet: { min: 2, max: 3, fallback: 3 },
  phone: { min: 1, max: 2, fallback: 2 },
} as const;

export interface GridColumns {
  desktop: number;
  tablet: number;
  phone: number;
}

export function toGridColumns(settings?: Partial<GridColumns> | null): GridColumns {
  return {
    desktop: clampColumns(settings?.desktop, GRID_COLUMN_LIMITS.desktop),
    tablet: clampColumns(settings?.tablet, GRID_COLUMN_LIMITS.tablet),
    phone: clampColumns(settings?.phone, GRID_COLUMN_LIMITS.phone),
  };
}

function clampColumns(
  value: unknown,
  limit: { min: number; max: number; fallback: number },
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return limit.fallback;
  return Math.min(limit.max, Math.max(limit.min, Math.round(value)));
}

/**
 * The list row carries `categoryName`, the detail row carries `category` plus
 * the full `variants[]`/`options[]` a list never projects. `variants` is the one
 * field the schema guarantees on a detail row and never declares on a list row,
 * so this is a shape test, not a guess — and narrowing on it means no `as`
 * anywhere below.
 */
function isDetail(product: CatalogProduct): product is ProductDetailDto {
  return "variants" in product;
}

/**
 * Sparse per-product card settings, keyed for the card.
 *
 * Passed through raw on purpose: the card runs its own
 * `resolveProductCardStyles` over this dict (flat prop → `styleConfig` → product
 * settings → theme), so pre-resolving here would freeze the theme out of the
 * precedence chain. The resolver type-guards every key, which is also why an
 * unexpected value from catalog is harmless rather than a cast to defend.
 */
function toCardSettings(
  settings: Record<string, unknown> | null | undefined,
): Partial<ProductCardStyleConfig> | undefined {
  if (settings === null || settings === undefined) return undefined;
  if (Object.keys(settings).length === 0) return undefined;
  return { ...settings };
}

/**
 * One catalog row → one card. Never throws, never fetches, never coerces money.
 */
export function fromCatalog(product: CatalogProduct): ProductCardData {
  // One guard, four branches: `detail` is an alias of the type predicate, so
  // TypeScript narrows `product` at each use and no `as` is needed below.
  const detail = isDetail(product);
  const displayed = product.effectivePrice ?? product.price;
  const compareAt = product.compareAtPrice ?? null;
  const badges = toBadges(product.badges);
  const cardSettings = toCardSettings(product.cardSettings);

  const brandName = detail ? product.brand?.name : product.brandName;
  const categoryName = detail ? product.category?.name : product.categoryName;
  const options = toCardOptions(product.cardOptions);
  const image = toImages(product.images, detail ? undefined : product.primaryImageUrl, product.name);
  const variants = toCardVariants(detail ? undefined : product.cardVariants);

  const card: ProductCardData = {
    id: product.id,
    name: product.name,
    price: displayed,
    category: categoryName ?? CATEGORY_UNKNOWN,
    image: image.image,
    // routing.md §1: a PDP is `/products/[slug]`, slugs never ids. The card is
    // not a link (product.md §10) — `url` is the owner's navigation data, and
    // `ProductCardData` deliberately has no `slug` field to fill.
    url: `${LISTING_FOLDER}/${encodeURIComponent(product.slug)}`,
    stock: toProductStock(product.stock),
    ...(compareAt !== null && compareAt > displayed ? { compareAt } : {}),
    ...(image.images !== undefined ? { images: image.images } : {}),
    ...(image.hoverImage !== undefined ? { hoverImage: image.hoverImage } : {}),
    ...(brandName !== null && brandName !== undefined ? { brand: { name: brandName } } : {}),
    ...(badges !== undefined ? { badges } : {}),
    ...(options !== undefined ? { options } : {}),
    ...(cardSettings !== undefined ? { cardSettings } : {}),
    ...(variants !== undefined ? { cardVariants: variants } : {}),
  };

  // A tag is the badge face for a product with no centralized badges; the card
  // only reads it when `badges` is empty, so the first one is enough.
  const tag = product.tags?.[0];
  if (tag !== undefined) card.tag = tag;

  return card;
}

/** The whole page in one call — a listing never maps per card at the call site. */
export function fromCatalogList(products: readonly CatalogProduct[]): ProductCardData[] {
  return products.map(fromCatalog);
}
