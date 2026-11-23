import type { NextRequest, NextResponse } from "next/server";
import { jsonNoStore } from "@/lib/bff/handler";
import { catalogClient } from "@/lib/catalog/client";
import { fromCatalogList } from "@/lib/commerce/fromCatalog";
import { readCookie } from "@/lib/auth/session";
import {
  parseRecentlyViewed,
  RECENTLY_VIEWED_COOKIE,
} from "@/lib/recently-viewed/cookie";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const cookieHeader = readCookie(request.cookies, RECENTLY_VIEWED_COOKIE);
  const slugs = parseRecentlyViewed(cookieHeader);

  const { searchParams } = new URL(request.url);
  const excludeSlug = searchParams.get("exclude");
  const filteredSlugs = excludeSlug
    ? slugs.filter((s) => s !== excludeSlug)
    : slugs;

  if (filteredSlugs.length === 0) {
    return jsonNoStore({ products: [] });
  }

  const promises = filteredSlugs.map((slug) => catalogClient().getProduct(slug));
  const results = await Promise.all(promises);
  const activeProducts = results.flatMap((res) =>
    res.ok && res.data.status === "active" ? [res.data] : [],
  );

  const cards = fromCatalogList(activeProducts);
  return jsonNoStore({ products: cards });
}
