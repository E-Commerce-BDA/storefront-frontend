"use client";

/**
 * ProductGridIsland — the product grid's one client boundary — sf-051, moved to
 * the shared commerce layer at sf-060
 * (plan §8 route table + decision 16: islands live with the grid they drive)
 *
 * It moved out of `app/(shop)/_components` the moment a second surface needed
 * it: the CMS `product_collection` section lives in `components/sections`, and a
 * shared block importing a route-group file would invert the dependency. The
 * listing, the PDP's related rail and the home sections all drive this one
 * island, so quick-add behaves identically everywhere products appear.
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
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ProductGrid from "@/components/commerce/ProductGrid";
import QuickViewDialog from "@/components/commerce/QuickViewDialog";
import { useCart } from "@/app/_components/CartProvider";
import { useWishlist } from "@/app/_components/WishlistProvider";
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
  const wishlist = useWishlist();
  const refresh = cart.refresh;

  const [activeQuickView, setActiveQuickView] = useState<ProductCardData | null>(null);

  const port = useMemo(
    () => createCartPort({ onAdded: () => void refresh() }),
    [refresh],
  );
  const { addedIds, pendingIds, quickAdd } = useQuickAdd(port);

  // The ring/check is a confirmation, not a permanent banner: useQuickAdd keeps
  // addedIds until the owner clears them, so the island holds a short-lived
  // flash set that decays ~1.6s after each add. The dumb grid and the shared
  // hook API stay untouched — only the ids we forward to the cell change.
  const FLASH_MS = 1600;
  const [flashIds, setFlashIds] = useState<string[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    for (const id of addedIds) {
      if (timersRef.current.has(id)) continue;
      setFlashIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
      const timer = setTimeout(() => {
        setFlashIds((prev) => prev.filter((x) => x !== id));
        timersRef.current.delete(id);
      }, FLASH_MS);
      timersRef.current.set(id, timer);
    }
  }, [addedIds]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  const cellKeyById = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of items) map.set(item.id, item.url ?? item.id);
    return map;
  }, [items]);

  const toCellKeys = (ids: readonly string[]) =>
    ids.map((id) => cellKeyById.get(id) ?? id);

  return (
    <>
      <ProductGrid
        items={items}
        columns={columns}
        empty={empty}
        label={label}
        pendingIds={toCellKeys(pendingIds)}
        addedIds={toCellKeys(flashIds)}
        wishlistedIds={wishlist.ids}
        onOpen={(product) => {
          if (product.url) router.push(product.url);
        }}
        onQuickAdd={(product) => quickAdd(product.id)}
        onQuickView={(product) => setActiveQuickView(product)}
        onWishlist={(product) => void wishlist.toggle(product.id)}
      />

      <QuickViewDialog
        product={activeQuickView}
        open={activeQuickView !== null}
        onClose={() => setActiveQuickView(null)}
        onAddToCart={async (productId, variantId, qty) => {
          await cart.add(productId, { variantId, qty });
          cart.openDrawer();
        }}
      />
    </>
  );
}
