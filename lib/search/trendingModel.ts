/**
 * Trending model — sf-066 (search-svc srch-006)
 *
 * Pure: the BFF response shape and its mapping into the palette's two regions.
 * `terms` drives the trending column; only `type === "product"` items become
 * curated cards, and they reuse the same "Products" category token as suggest
 * so the department filter treats them identically.
 */

import { z } from "zod";
import { SEARCH_PRODUCT_CATEGORY, type SearchResult } from "./source";

export const trendingItemSchema = z
  .object({
    id: z.string(),
    type: z.string(),
    title: z.string(),
    slug: z.string(),
    image: z.string().nullish(),
    price: z.number().nullish(),
    effectivePrice: z.number().nullish(),
    popularity: z.number().nullish(),
    updatedAt: z.string().nullish(),
  })
  .loose();

export const trendingResponseSchema = z
  .object({
    terms: z.array(z.string()),
    items: z.array(trendingItemSchema),
    generatedAt: z.string(),
  })
  .loose();

export type TrendingResponse = z.infer<typeof trendingResponseSchema>;
export type TrendingItem = z.infer<typeof trendingItemSchema>;

export interface PaletteTrending {
  terms: string[];
  curated: SearchResult[];
}

export function mapTrendingToPalette(body: TrendingResponse): PaletteTrending {
  return {
    terms: [...body.terms],
    curated: body.items
      .filter((item) => item.type === "product")
      .map((item): SearchResult => ({
        id: item.id,
        name: item.title,
        price: item.effectivePrice ?? item.price ?? 0,
        image: item.image ?? "",
        category: SEARCH_PRODUCT_CATEGORY,
        url: `/products/${item.slug}`,
      })),
  };
}
