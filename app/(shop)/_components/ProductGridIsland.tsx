"use client";

/**
 * ProductGridIsland — the listing's one client boundary — sf-051
 * (plan §8 route table + decision 16: `(shop)` group islands live together)
 *
 * Catalog data is fetched in the RSC (decision 5: SEO, no extra hop) and arrives
 * here already mapped to `ProductCardData`. Everything interactive needs a
 * client component, and this is the smallest one that works: cards, quick-add,
 * navigation. It owns no data and fetches nothing.
 *
 * **One add path.** The `QuickAddPort` posts the item and then asks the store to
 * `refresh()` and reconcile. Calling `cart.add()` as well would POST twice — the
 * idempotency key is per-call, so two calls are two adds. The card's own
 * pending/added feedback comes from `useQuickAdd`, so the shopper still gets an
 * instant answer without a second optimistic write fighting the reconciled one.
 *
 * **Why the ids get translated.** `ProductGrid` marks a cell by
 * `url ?? id` (product.md §15 — a catalog page speaks urls, and the url is the
 * stable identity a card owns), but a POST needs the product **id**. The hook can
 * only key on what it is handed, so this island is the one place that keeps both
 * vocabularies straight: `quickAdd(id)` for the network, url-keyed sets for the
 * paint.
 */
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import ProductGrid from "@/components/commerce/ProductGrid";
import { useCart } from "@/app/_components/CartProvider";
import { useQuickAdd } from "@/app/hooks/useQuickAdd";
import { createCartPort } from "@/lib/cart/port";
import type { ProductCardData } from "@/lib/commerce/productCard";

export interface ProductGridIslandProps {
  items: ProductCardData[];
  /** Forwarded straight to the grid (product.md §15). */
  columns?: React.ComponentProps<typeof ProductGrid>["columns"];
  /** Empty state the owner resolved in the RSC. */
  empty?: React.ReactNode;
  label?: string;
}

export default function ProductGridIsland({
  items,
  columns,
  empty,
  label,
}: ProductGridIslandProps) {
  const router = useRouter();
  const cart = useCart();
  const refresh = cart.refresh;

  const port = useMemo(
    () => createCartPort({ onAdded: () => void refresh() }),
    [refresh],
  );
  const { addedIds, pendingIds, quickAdd } = useQuickAdd(port);

  const cellKeyById = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of items) map.set(item.id, item.url ?? item.id);
    return map;
  }, [items]);

  const toCellKeys = (ids: readonly string[]) =>
    ids.map((id) => cellKeyById.get(id) ?? id);

  return (
    <ProductGrid
      items={items}
      columns={columns}
      empty={empty}
      label={label}
      pendingIds={toCellKeys(pendingIds)}
      addedIds={toCellKeys(addedIds)}
      onOpen={(product) => {
        if (product.url) router.push(product.url);
      }}
      onQuickAdd={(product) => quickAdd(product.id)}
    />
  );
}
