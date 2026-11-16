import type { NextRequest, NextResponse } from "next/server";
import { jsonNoStore, toResponse } from "@/lib/bff/handler";
import { searchClient } from "@/lib/search/client";
import type { SearchSuggestResponse } from "@ecom/contracts";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  const emptyResponse: SearchSuggestResponse = {
    query: q,
    categories: [],
    products: [],
    blogs: [],
  };

  if (q.length < 2) {
    return jsonNoStore(emptyResponse);
  }

  const limitParam = searchParams.get("limit");
  const limit = limitParam
    ? Math.max(1, Math.min(20, parseInt(limitParam, 10) || 8))
    : 8;

  const result = await searchClient().suggest(q, limit);
  if (!result.ok) {
    return toResponse(result);
  }

  return jsonNoStore(result.data);
}
