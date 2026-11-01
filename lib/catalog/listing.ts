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
 * 1. **`?category=` is a slug, not a `categoryId`.** routing.md §1 makes it a
 *    filter on the ONE canonical listing route (never a path segment), and the
 *    URL speaks slugs, not ids. Resolving slug → id is a fetch (getCategory), so
 *    it is deliberately *not* done here — the page does that and folds the id
 *    into the query. This resolver only reports the slug it was given.
 * 2. **A junk value falls to the default, never to a guess at intent.** `?sort=`
 *    not in `CATALOG_SORTS` becomes "no sort" (catalog's own default), not the
 *    nearest valid key. Silently reinterpreting a typo would make the URL lie
 *    about the page it produced.
 */

import { CATALOG_SORTS, type CatalogSort } from "@/lib/catalog/schemas";
import type { CatalogQuery } from "@/lib/catalog/client";

/** Page size when `?limit=` is absent or unusable. */
export const LISTING_LIMIT = 24;
/** catalog-svc caps `limit` at 100 (plan §5.5); asking for more is clamped. */
export const LISTING_MAX_LIMIT = 100;

export type SearchParamValue = string | string[] | undefined;

/** Everything the page needs to fetch one listing. */
export interface ListingParams {
  /** `?category=` slug — the page resolves it to a `categoryId`. */
  categorySlug: string | undefined;
  /**
   * A ready query. `status` is not here (the client pins `active`) and
   * `categoryId` is not here (it needs the slug → id fetch), so this is the
   * subset of `CatalogQuery` a query string alone can express.
   */
  query: Pick<CatalogQuery, "limit" | "q" | "sort" | "cursor">;
}

/** Next 16 hands `searchParams` values that may be repeated; the first wins. */
function first(value: SearchParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** A non-empty trimmed string, or `undefined`. Whitespace is absence. */
function trimmed(value: SearchParamValue): string | undefined {
  const raw = first(value);
  if (raw === undefined) return undefined;
  const out = raw.trim();
  return out === "" ? undefined : out;
}

/** Only a sort the catalog actually offers survives the whitelist. */
function toSort(value: SearchParamValue): CatalogSort | undefined {
  const raw = first(value);
  if (raw === undefined) return undefined;
  return (CATALOG_SORTS as readonly string[]).includes(raw)
    ? (raw as CatalogSort)
    : undefined;
}

/** A positive page size, clamped to the catalog cap; junk falls to the default. */
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
  const q = trimmed(params.q);
  const sort = toSort(params.sort);
  const cursor = trimmed(params.cursor);

  const query: ListingParams["query"] = { limit: toLimit(params.limit) };
  if (q !== undefined) query.q = q;
  if (sort !== undefined) query.sort = sort;
  if (cursor !== undefined) query.cursor = cursor;

  return { categorySlug, query };
}

/**
 * A listing URL that keeps every filter and swaps in one cursor — the
 * "next page" link (routing.md §3 allows the cursor in query). Keys are emitted
 * in a fixed order so two shoppers with the same filters hit one cache entry and
 * a `null` cursor drops the param entirely (back to the first page).
 */
export function buildListingQuery(filters: {
  categorySlug?: string | undefined;
  q?: string | undefined;
  sort?: string | undefined;
  cursor?: string | null | undefined;
}): string {
  const sp = new URLSearchParams();
  if (filters.categorySlug) sp.set("category", filters.categorySlug);
  if (filters.q) sp.set("q", filters.q);
  if (filters.sort) sp.set("sort", filters.sort);
  if (filters.cursor) sp.set("cursor", filters.cursor);
  const search = sp.toString();
  return search === "" ? "" : `?${search}`;
}
