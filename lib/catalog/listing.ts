/**
 * Listing params resolver — sf-051
 * (plan §8/§12: `/products` reads `searchParams`, and the rules must live once)
 *
 * The route is a server component and the query string is untrusted input:
 * `?sort=` could be anything a shopper typed, `?limit=` could be `999999`, `?q=`
 * could be whitespace. Catalog would answer those literally (a huge page, a
 * meaningless sort). This file turns raw `searchParams` into a safe
 * `CatalogQuery` so the page has one line of logic and the whitelist/clamp rules
 * have one home that is node-testable without React or Next.
 *
 * Two decisions worth stating:
 *
 * 1. **`?category=` and `?brand=` are slugs, not ids.** routing.md §1 makes them
 *    filters on the ONE canonical listing route (never path segments), and the
 *    URL speaks slugs, not ids. Resolving slug → id is a fetch (getCategory /
 *    getBrand), so it is deliberately *not* done here — the page does that and
 *    folds the id into the query. This resolver only reports the slugs it was
 *    given. `?brand=` arrived with sf-060: the brand marquee links every cell,
 *    so a brand slug that silently narrowed to nothing would be a dead logo.
 * 2. **A junk value falls to the default, never to a guess at intent.** `?sort=`
 *    not in `CATALOG_SORTS` becomes "no sort" (catalog's own default), not the
 *    nearest valid key. Silently reinterpreting a typo would make the URL lie
 *    about the page it produced.
 */

import { CATALOG_SORTS, type CatalogSort } from "@/lib/catalog/schemas";
import type { CatalogQuery } from "@/lib/catalog/client";

export const LISTING_LIMIT = 24;
/** catalog-svc caps `limit` at 100 (plan §5.5); asking for more is clamped. */
export const LISTING_MAX_LIMIT = 100;

export type SearchParamValue = string | string[] | undefined;

export interface ListingParams {
  categorySlug: string | undefined;
  brandSlug: string | undefined;
  tags: string[] | undefined;
  discounted: boolean | undefined;
  /**
   * A ready query. `status` is not here (the client pins `active`) and neither
   * is `categoryId`/`brandId` (they need a slug → id fetch), so this is the
   * subset of `CatalogQuery` a query string alone can express.
   */
  query: Pick<
    CatalogQuery,
    "limit" | "q" | "sort" | "cursor" | "minPrice" | "maxPrice"
  >;
}

/** Next 16 hands `searchParams` values that may be repeated; the first wins. */
function first(value: SearchParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function trimmed(value: SearchParamValue): string | undefined {
  const raw = first(value);
  if (raw === undefined) return undefined;
  const out = raw.trim();
  return out === "" ? undefined : out;
}

function toSort(value: SearchParamValue): CatalogSort | undefined {
  const raw = first(value);
  if (raw === undefined) return undefined;
  return (CATALOG_SORTS as readonly string[]).includes(raw)
    ? (raw as CatalogSort)
    : undefined;
}

function toTags(value: SearchParamValue): string[] | undefined {
  const raw = Array.isArray(value) ? value : [value];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const entry of raw) {
    if (entry === undefined) continue;
    for (const part of entry.split(",")) {
      const tag = part.trim();
      if (tag === "" || seen.has(tag)) continue;
      seen.add(tag);
      out.push(tag);
      if (out.length >= 10) return out;
    }
  }
  return out.length > 0 ? out : undefined;
}

function toDiscounted(value: SearchParamValue): boolean | undefined {
  const raw = first(value);
  return raw === "true" ? true : undefined;
}

function toPrice(value: SearchParamValue): number | undefined {
  const raw = first(value);
  if (raw === undefined || raw.trim() === "") return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function toLimit(value: SearchParamValue): number {
  const raw = first(value);
  if (raw === undefined) return LISTING_LIMIT;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 1) return LISTING_LIMIT;
  return Math.min(Math.round(parsed), LISTING_MAX_LIMIT);
}

/** Raw `searchParams` → the safe query one page fetch. Never throws. */
export function parseListingParams(
  params: Record<string, SearchParamValue>,
): ListingParams {
  const categorySlug = trimmed(params.category);
  const brandSlug = trimmed(params.brand);
  const q = trimmed(params.q);
  const sort = toSort(params.sort);
  const cursor = trimmed(params.cursor);
  const tags = toTags(params.tags);
  const discounted = toDiscounted(params.discounted);

  const query: ListingParams["query"] = { limit: toLimit(params.limit) };
  if (q !== undefined) query.q = q;
  if (sort !== undefined) query.sort = sort;
  if (cursor !== undefined) query.cursor = cursor;
  const minPrice = toPrice(params.minPrice);
  const maxPrice = toPrice(params.maxPrice);
  if (minPrice !== undefined) query.minPrice = minPrice;
  if (maxPrice !== undefined) query.maxPrice = maxPrice;

  return { categorySlug, brandSlug, tags, discounted, query };
}

/**
 * A listing URL that keeps every filter and swaps in one cursor — the
 * "next page" link (routing.md §3 allows the cursor in query). Keys are emitted
 * in a fixed order so two shoppers with the same filters hit one cache entry and
 * a `null` cursor drops the param entirely (back to the first page).
 */
export function buildListingQuery(filters: {
  categorySlug?: string | undefined;
  brandSlug?: string | undefined;
  q?: string | undefined;
  sort?: string | undefined;
  tags?: readonly string[] | undefined;
  discounted?: boolean | undefined;
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
  cursor?: string | null | undefined;
}): string {
  const sp = new URLSearchParams();
  if (filters.categorySlug) sp.set("category", filters.categorySlug);
  if (filters.brandSlug) sp.set("brand", filters.brandSlug);
  if (filters.q) sp.set("q", filters.q);
  if (filters.sort) sp.set("sort", filters.sort);
  if (filters.tags && filters.tags.length > 0) sp.set("tags", filters.tags.join(","));
  if (filters.discounted) sp.set("discounted", "true");
  if (filters.minPrice !== undefined) sp.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice !== undefined) sp.set("maxPrice", String(filters.maxPrice));
  if (filters.cursor) sp.set("cursor", filters.cursor);
  const search = sp.toString();
  return search === "" ? "" : `?${search}`;
}
