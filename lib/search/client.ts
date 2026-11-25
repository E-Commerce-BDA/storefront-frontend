import { createServiceClient } from "@/lib/http/client";
import type { Perform, ServiceResult } from "@/lib/http/result";
import { searchSuggestResponseSchema, type SearchSuggestResponse } from "@ecom/contracts";
import { trendingResponseSchema, type TrendingResponse } from "./trendingModel";

export interface SearchClient {
  suggest(q: string, limit?: number): Promise<ServiceResult<SearchSuggestResponse>>;
  /** srch-006: internal trending, service key attached only here (server-side). */
  trending(limit?: number): Promise<ServiceResult<TrendingResponse>>;
}

const BASE = "/api/v1/search";

export function createSearchClient(perform: Perform): SearchClient {
  return {
    suggest(q, limit = 8) {
      return perform({
        method: "GET",
        path: `${BASE}/suggest`,
        query: { q, limit },
        schema: searchSuggestResponseSchema,
        cache: "no-store",
      });
    },

    trending(limit = 8) {
      const key = process.env.INTERNAL_SERVICE_KEY?.trim();
      // Fail closed: no key means no call, never an unauthenticated upstream
      // request that could look like a broken contract to search-svc.
      if (!key) {
        return Promise.resolve({
          ok: false as const,
          kind: "unavailable" as const,
          status: 0,
          code: "SERVICE_KEY_MISSING",
          message: "Internal service key is not configured",
        });
      }
      return perform({
        method: "GET",
        path: `${BASE}/internal/trending`,
        query: { limit },
        headers: { "x-service-key": key },
        schema: trendingResponseSchema,
        cache: "no-store",
      });
    },
  };
}

export function searchClient(): SearchClient {
  return createSearchClient(createServiceClient("search"));
}
