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

import { useCallback, useMemo, useRef, useState } from "react";
import ProductGridIsland from "@/components/commerce/ProductGridIsland";
import Button from "@/components/ui/Button";
import { bff } from "@/lib/http/browser";
import type { ProductCardData } from "@/lib/commerce/productCard";

type Status = "idle" | "loading" | "error" | "done";

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
  const [items, setItems] = useState<ProductCardData[]>(initialItems);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [status, setStatus] = useState<Status>(
    initialCursor === null ? "done" : "idle",
  );
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

  const loadMore = useCallback(async () => {
    if (cursor === null || status === "loading" || status === "done") return;
    const nextKey = withCursor(queryKey, cursor);
    const cached = cacheRef.current.get(nextKey);
    if (cached !== undefined) {
      setItems((prev) => {
        const known = new Set(prev.map((item) => item.id));
        return [...prev, ...cached.items.filter((item) => !known.has(item.id))];
      });
      setCursor(cached.nextCursor);
      setStatus(cached.nextCursor === null ? "done" : "idle");
      return;
    }

    setStatus("loading");
    const result = await bff<{
      items: ProductCardData[];
      nextCursor: string | null;
    }>(`/api/catalog/products${nextKey}`);
    if (!result.ok || !Array.isArray(result.data?.items)) {
      setStatus("error");
      return;
    }
    const page = {
      items: result.data.items,
      nextCursor: result.data.nextCursor ?? null,
    };
    cacheRef.current.set(nextKey, page);
    setItems((prev) => {
      const known = new Set(prev.map((item) => item.id));
      return [...prev, ...page.items.filter((item) => !known.has(item.id))];
    });
    setCursor(page.nextCursor);
    setStatus(page.nextCursor === null ? "done" : "idle");
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
