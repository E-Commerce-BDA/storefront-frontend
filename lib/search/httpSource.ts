"use client";

import { bff } from "@/lib/http/browser";
import { searchSuggestResponseSchema, type SearchSuggestResponse } from "@ecom/contracts";
import type { SearchResult, SearchSource } from "./source";

export function createHttpSearchSource(): SearchSource {
  return {
    async suggest(q: string, signal: AbortSignal): Promise<SearchResult[]> {
      const clean = q.trim();
      if (clean.length < 2) return [];

      const result = await bff<SearchSuggestResponse>(
        `/api/search/suggest?q=${encodeURIComponent(clean)}`,
        {
          schema: searchSuggestResponseSchema,
          signal,
        },
      );

      if (!result.ok) {
        throw new Error(result.message ?? result.code ?? "Search service unavailable");
      }

      const { products } = result.data;
      return products.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.effectivePrice ?? p.price ?? 0,
        image: typeof p.image === "string" ? p.image : (p.image as { url?: string } | undefined)?.url ?? "",
        category: "Products",
        url: `/products/${p.slug}`,
      }));
    },
  };
}
