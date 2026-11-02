import { createServiceClient } from "@/lib/http/client";
import type { Perform, ServiceResult } from "@/lib/http/result";
import { searchSuggestResponseSchema, type SearchSuggestResponse } from "@ecom/contracts";

export interface SearchClient {
  suggest(q: string, limit?: number): Promise<ServiceResult<SearchSuggestResponse>>;
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
  };
}

export function searchClient(): SearchClient {
  return createSearchClient(createServiceClient("search"));
}
