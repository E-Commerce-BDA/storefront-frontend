"use client";

/**
 * Listing grid + load-more island — sf-054.
 *
 * The first page arrives server-rendered for SEO; this boundary owns only the
 * accumulated rows and the cursor for later pages. Every fetch goes through
 * the listing BFF on this origin, never catalog-svc. A page already seen in
 * this session comes from the in-memory cache, so back/forward and a repeated
 * click never re-fetch it or duplicate a card.
 */

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import ProductGridIsland from "@/components/commerce/ProductGridIsland";
import Button from "@/components/ui/Button";
import { bff } from "@/lib/http/browser";
import type { ProductCardData } from "@/lib/commerce/productCard";
import { initialListingMachine, listingMachine } from "@/lib/listing/machine";

export interface ListingGridIslandProps {
  initialItems: ProductCardData[];
  initialCursor: string | null;
  /** Canonical listing query (filters + sort), without a cursor. */
  queryKey: string;
  columns?: React.ComponentProps<typeof ProductGridIsland>["columns"];
  themeFallback?: React.ComponentProps<typeof ProductGridIsland>["themeFallback"];
  tones?: React.ComponentProps<typeof ProductGridIsland>["tones"];
  empty?: React.ReactNode;
}

function withCursor(queryKey: string, cursor: string): string {
  const sp = new URLSearchParams(queryKey.replace(/^\?/, ""));
  sp.set("cursor", cursor);
  return `?${sp.toString()}`;
}

export default function ListingGridIsland({
  initialItems,
  initialCursor,
  queryKey,
  columns,
  themeFallback,
  tones,
  empty,
}: ListingGridIslandProps) {
  const [grid, dispatch] = useReducer(
    listingMachine,
    { queryKey, initialItems, initialCursor },
    ({ queryKey: key, initialItems: rows, initialCursor: next }) =>
      initialListingMachine(key, rows, next),
  );
  const { items, cursor, status } = grid;
  const cacheRef = useRef<Map<string, { items: ProductCardData[]; nextCursor: string | null }>>(
    new Map(),
  );

  // Seed the cache with the server-rendered page so a repeated click on the
  // same cursor is answered locally.
  useMemo(() => {
    if (!cacheRef.current.has(queryKey)) {
      cacheRef.current.set(queryKey, {
        items: initialItems,
        nextCursor: initialCursor,
      });
    }
  }, [queryKey, initialItems, initialCursor]);

  // A6: a new filter/sort query resets rows to the new server page. Without
  // this, rows from the previous query survive under the new query key.
  useEffect(() => {
    dispatch({ type: "query/change", queryKey, items: initialItems, cursor: initialCursor });
  }, [queryKey, initialItems, initialCursor]);

  const loadMore = useCallback(async () => {
    if (cursor === null || status === "loading" || (status !== "idle" && status !== "error")) return;
    const nextKey = withCursor(queryKey, cursor);
    const cached = cacheRef.current.get(nextKey);
    if (cached !== undefined) {
      dispatch({
        type: "more/success",
        queryKey,
        items: cached.items,
        cursor: cached.nextCursor,
      });
      return;
    }

    dispatch({ type: "more/start" });
    const result = await bff<{
      items: ProductCardData[];
      nextCursor: string | null;
    }>(`/api/catalog/products${nextKey}`);
    if (!result.ok || !Array.isArray(result.data?.items)) {
      dispatch({ type: "more/error" });
      return;
    }
    const page = {
      items: result.data.items,
      nextCursor: result.data.nextCursor ?? null,
    };
    cacheRef.current.set(nextKey, page);
    dispatch({ type: "more/success", queryKey, items: page.items, cursor: page.nextCursor });
  }, [cursor, queryKey, status]);

  return (
    <div className="sf-listing-grid" data-status={status} aria-busy={status === "loading"}>
      <ProductGridIsland
        items={items}
        columns={columns}
        themeFallback={themeFallback}
        tones={tones}
        empty={empty}
      />

      {status === "error" ? (
        <p className="sf-listing-grid__error" role="alert">
          The next products could not be loaded. Please try again.
        </p>
      ) : null}

      {cursor !== null ? (
        <div className="sf-listing-grid__more">
          <Button
            variant="light"
            onClick={() => void loadMore()}
            disabled={status === "loading"}
          >
            {status === "loading" ? "Loading…" : "Load more"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
