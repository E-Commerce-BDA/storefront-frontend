"use client";

import { useEffect, useState } from "react";
import ProductGridIsland from "@/components/commerce/ProductGridIsland";
import type { ProductCardData } from "@/lib/commerce/productCard";

export interface RecentlyViewedProps {
  excludeSlug?: string;
}

export default function RecentlyViewed({ excludeSlug }: RecentlyViewedProps) {
  const [items, setItems] = useState<ProductCardData[]>([]);

  useEffect(() => {
    let alive = true;
    const url = excludeSlug
      ? `/api/recently-viewed?exclude=${encodeURIComponent(excludeSlug)}`
      : "/api/recently-viewed";

    void fetch(url, { credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!alive || !data || !Array.isArray(data.products)) return;
        setItems(data.products);
      })
      .catch(() => {});

    return () => {
      alive = false;
    };
  }, [excludeSlug]);

  if (items.length === 0) return null;

  return (
    <section className="mt-12" aria-label="Recently viewed products">
      <h2 className="mb-4 font-display text-lg text-[var(--color-ink)]">Recently viewed</h2>
      <ProductGridIsland items={items} label="Recently viewed" />
    </section>
  );
}
