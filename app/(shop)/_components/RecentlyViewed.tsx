"use client";

import { useEffect, useState } from "react";
import ProductGridIsland from "@/components/commerce/ProductGridIsland";
import { DegradedState } from "@/components/ui";
import type { ProductCardData } from "@/lib/commerce/productCard";

export interface RecentlyViewedProps {
  excludeSlug?: string;
}

export default function RecentlyViewed({ excludeSlug }: RecentlyViewedProps) {
  const [items, setItems] = useState<ProductCardData[]>([]);
  // I-15: a failed fetch is not an empty list. Keep the failure distinct so
  // the section can say "unavailable" instead of pretending nothing was viewed.
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    const url = excludeSlug
      ? `/api/recently-viewed?exclude=${encodeURIComponent(excludeSlug)}`
      : "/api/recently-viewed";

    void fetch(url, { credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("recently-viewed failed"))))
      .then((data: unknown) => {
        if (!alive) return;
        const products =
          typeof data === "object" && data !== null && "products" in data
            ? (data as { products: unknown }).products
            : null;
        if (!Array.isArray(products)) {
          setFailed(true);
          return;
        }
        setFailed(false);
        setItems(products.filter((p): p is ProductCardData =>
          typeof p === "object" && p !== null && "id" in p && "name" in p,
        ));
      })
      .catch(() => {
        if (alive) setFailed(true);
      });

    return () => {
      alive = false;
    };
  }, [excludeSlug]);

  if (items.length === 0) {
    return failed ? (
      <section className="mt-12" aria-label="Recently viewed products">
        <h2 className="mb-4 font-display text-lg text-[var(--color-ink)]">Recently viewed</h2>
        <DegradedState title="Your recently viewed items are unavailable right now." />
      </section>
    ) : null;
  }

  return (
    <section className="mt-12" aria-label="Recently viewed products">
      <h2 className="mb-4 font-display text-lg text-[var(--color-ink)]">Recently viewed</h2>
      <ProductGridIsland items={items} label="Recently viewed" />
    </section>
  );
}
