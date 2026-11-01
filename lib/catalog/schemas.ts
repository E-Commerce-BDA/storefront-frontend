/**
 * Catalog schemas — sf-051
 * (catalog-svc `src/products/products.types.ts`, read from source)
 *
 * **Loose on purpose.** Every object keeps unknown keys (`.loose()`), so a new
 * field catalog adds — a `rating` average, a `warehouseCode` — cannot blank a
 * page. The other direction is strict: a field the UI *reads* is required here,
 * so a rename upstream fails as `CONTRACT_MISMATCH` instead of rendering
 * `undefined` in a price slot.
 *
 * These are local because `@ecom/contracts` 1.7.0 ships no REST response DTOs.
 * sf-053 repins the package and swaps these for the shared schemas; until then
 * this file is the contract, and it is checked against the service types, not
 * against prose.
 */

import { z } from "zod";

export const CATALOG_SORTS = [
  "price_asc",
  "price_desc",
  "created_desc",
  "name_asc",
] as const;

export type CatalogSort = (typeof CATALOG_SORTS)[number];

/* ── card-side fragments (mirror `ProductCardData`'s companions) ─────────── */

export const productImageSchema = z
  .object({
    id: z.string().optional(),
    url: z.string(),
    alt: z.string().nullish(),
    isPrimary: z.boolean().optional(),
    sortOrder: z.number().optional(),
  })
  .loose();

export const cardBadgeSchema = z
  .object({
    id: z.string().optional(),
    key: z.string(),
    label: z.string(),
    bg: z.string(),
    textColor: z.string(),
    borderColor: z.string().nullish(),
    borderStyle: z.enum(["solid", "dashed", "dotted"]).nullish(),
  })
  .loose();

export const cardOptionValueSchema = z
  .object({
    id: z.string().optional(),
    value: z.string(),
    position: z.number().optional(),
    swatchHex: z.string().nullish(),
    swatchImageUrl: z.string().nullish(),
    inStock: z.boolean().optional(),
  })
  .loose();

export const cardOptionSchema = z
  .object({
    id: z.string().optional(),
    name: z.string(),
    displayType: z.enum(["text", "pill", "swatch"]),
    showOnCard: z.boolean(),
    cardPlacement: z
      .enum(["info", "media", "brand-hover", "media-hover-top", "hidden"])
      .nullish(),
    values: z.array(cardOptionValueSchema),
  })
  .loose();

export const cardVariantSchema = z
  .object({
    id: z.string(),
    sku: z.string(),
    price: z.number(),
    compareAtPrice: z.number().nullish(),
    stock: z.number(),
    imageUrl: z.string().nullish(),
    optionValues: z.record(z.string(), z.string()),
  })
  .loose();

/* ── list ────────────────────────────────────────────────────────────────── */

export const productListItemSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    shortDescription: z.string().nullish(),
    price: z.number(),
    compareAtPrice: z.number().nullish(),
    /** Discount-adjusted price; absent → `price` (see `fromCatalog`). */
    effectivePrice: z.number().nullish(),
    stock: z.number(),
    categoryId: z.string().nullish(),
    categoryName: z.string().nullish(),
    categorySlug: z.string().nullish(),
    brandId: z.string().nullish(),
    brandName: z.string().nullish(),
    primaryImageUrl: z.string().nullish(),
    images: z.array(productImageSchema).nullish(),
    tags: z.array(z.string()).nullish(),
    badges: z.array(cardBadgeSchema).nullish(),
    cardOptions: z.array(cardOptionSchema).nullish(),
    cardVariants: z.array(cardVariantSchema).nullish(),
    cardSettings: z.record(z.string(), z.unknown()).nullish(),
    createdAt: z.string().nullish(),
    updatedAt: z.string().nullish(),
  })
  .loose();

export const productListResponseSchema = z
  .object({
    data: z.array(productListItemSchema),
    nextCursor: z.string().nullish(),
  })
  .loose();

/* ── detail ──────────────────────────────────────────────────────────────── */

export const variantOptionValueSchema = z
  .object({
    optionId: z.string(),
    optionName: z.string(),
    optionValueId: z.string(),
    value: z.string(),
  })
  .loose();

export const productVariantSchema = z
  .object({
    id: z.string(),
    productId: z.string().optional(),
    sku: z.string(),
    price: z.number(),
    stock: z.number(),
    imageUrl: z.string().nullish(),
    isActive: z.boolean().optional(),
    options: z.array(variantOptionValueSchema),
  })
  .loose();

export const productOptionValueSchema = z
  .object({
    id: z.string(),
    optionId: z.string().optional(),
    value: z.string(),
    position: z.number().optional(),
    swatchHex: z.string().nullish(),
    swatchImageUrl: z.string().nullish(),
  })
  .loose();

export const productOptionSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    position: z.number().optional(),
    displayType: z.enum(["text", "pill", "swatch"]),
    showOnCard: z.boolean().optional(),
    values: z.array(productOptionValueSchema),
  })
  .loose();

export const productDetailSchema = z
  .object({
    id: z.string(),
    sku: z.string().optional(),
    name: z.string(),
    slug: z.string(),
    shortDescription: z.string().nullish(),
    description: z.string().nullish(),
    price: z.number(),
    compareAtPrice: z.number().nullish(),
    effectivePrice: z.number().nullish(),
    stock: z.number(),
    category: z
      .object({ id: z.string(), name: z.string(), slug: z.string() })
      .loose()
      .nullish(),
    brand: z
      .object({
        id: z.string(),
        name: z.string(),
        slug: z.string().optional(),
        logoUrl: z.string().nullish(),
      })
      .loose()
      .nullish(),
    tags: z.array(z.string()).nullish(),
    attributes: z.record(z.string(), z.unknown()).nullish(),
    photoSettings: z.record(z.string(), z.unknown()).nullish(),
    cardSettings: z.record(z.string(), z.unknown()).nullish(),
    badges: z.array(cardBadgeSchema).nullish(),
    cardOptions: z.array(cardOptionSchema).nullish(),
    images: z.array(productImageSchema).default([]),
    options: z.array(productOptionSchema).default([]),
    variants: z.array(productVariantSchema).default([]),
  })
  .loose();

export const productResponseSchema = z.object({ product: productDetailSchema }).loose();

/* ── categories ──────────────────────────────────────────────────────────── */

export const categorySchema = z
  .object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    parentId: z.string().nullish(),
    description: z.string().nullish(),
    imageUrl: z.string().nullish(),
  })
  .loose();

export const categoryListResponseSchema = z
  .object({ data: z.array(categorySchema) })
  .loose();

export const categoryResponseSchema = z.object({ category: categorySchema }).loose();

export type ProductImageDto = z.infer<typeof productImageSchema>;
export type ProductCardBadgeDto = z.infer<typeof cardBadgeSchema>;
export type ProductCardOptionDto = z.infer<typeof cardOptionSchema>;
export type CardVariantDto = z.infer<typeof cardVariantSchema>;
export type ProductListItemDto = z.infer<typeof productListItemSchema>;
export type ProductDetailDto = z.infer<typeof productDetailSchema>;
export type ProductVariantDto = z.infer<typeof productVariantSchema>;
export type CatalogCategory = z.infer<typeof categorySchema>;
