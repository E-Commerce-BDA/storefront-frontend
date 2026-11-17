import type { NextRequest, NextResponse } from "next/server";
import { apiError, jsonNoStore } from "@/lib/bff/handler";
import { loadListingPage, searchParamsToRecord } from "@/lib/catalog/listingPage";

/**
 * Listing BFF — one read action (sf-054).
 *
 * The first page is server-rendered for SEO; this route exists so the client
 * island can append later pages through this origin, never catalog-svc. The
 * same loader serves both, so slug resolution, mapping and skip rules cannot
 * drift between the two paths.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const result = await loadListingPage(searchParamsToRecord(searchParams));

  if (!result.ok) {
    return result.kind === "unavailable"
      ? apiError(503, "CATALOG_UNAVAILABLE", "The catalog could not be reached")
      : apiError(404, "FILTER_NOT_FOUND", `No ${result.scope} “${result.slug ?? ""}”`);
  }

  return jsonNoStore({
    items: result.data.items,
    nextCursor: result.data.nextCursor,
  });
}
