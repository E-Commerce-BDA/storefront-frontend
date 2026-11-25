"use client";

/** Browser port for the palette's empty-query regions — sf-066. */
import { bff } from "@/lib/http/browser";
import {
  mapTrendingToPalette,
  trendingResponseSchema,
  type PaletteTrending,
  type TrendingResponse,
} from "./trendingModel";

const EMPTY: PaletteTrending = { terms: [], curated: [] };

export async function fetchPaletteTrending(signal?: AbortSignal): Promise<PaletteTrending> {
  const result = await bff<TrendingResponse>("/api/search/trending", {
    schema: trendingResponseSchema,
    signal,
  });
  // Trending is decoration: an outage leaves the overlay empty, never broken.
  return result.ok ? mapTrendingToPalette(result.data) : EMPTY;
}
