import type { CSSProperties, ReactNode } from "react";
import ProductCard from "./ProductCard";
import type { ProductCardData } from "@/lib/commerce/productCard";
import { toGridColumns, type GridColumns } from "@/lib/commerce/fromCatalog";

/**
 * Dumb ProductGrid — a face of `ProductCard`s, product.md §15.
 *
 * **Maps, never fetches.** A listing page, a category rail and the home's
 * featured row all need the same arrangement of the same cards, and none of them
 * should own a second copy of the column rules. Data is a prop; the owner decides
 * where it came from (catalog in RSC, the cart store, a CMS section — sf-060).
 *
 * Columns arrive as the theme's three numbers and leave as three inline vars, so
 * the media-query ladder lives in one CSS block instead of in breakpoints
 * repeated per route (`product.md` §1: card never knows siblings — the *grid*
 * takes `columns`).
 *
 * `pendingIds` / `addedIds` are the one honest place a quick-add's state can be
 * painted: the card itself must not learn about carts, so the cell carries
 * `data-pending` / `data-added` and the CSS does the rest. The id may be the
 * card's `url` (what a catalog page has) or its `id` (what a search row has) —
 * both are stable per card, and forcing callers to translate one into the other
 * would be a rule with no purpose.
 */
export interface ProductGridProps {
  items: ProductCardData[];
  /** Cards with a mutation in flight — reported by the store, not by the card. */
  pendingIds?: readonly string[];
  /** Cards whose last add succeeded, until the owner clears them. */
  addedIds?: readonly string[];
  onOpen?: (product: ProductCardData) => void;
  onQuickAdd?: (product: ProductCardData) => void;
  onQuickView?: (product: ProductCardData) => void;
  onWishlist?: (product: ProductCardData) => void;
  wishlistedIds?: readonly string[] | Set<string>;
  /** Theme `productCard.cols*`; absent or out-of-range falls to the defaults. */
  columns?: Partial<GridColumns> | null;
  /** Global theme card layer (flat/styleConfig/product still win). */
  themeFallback?: React.ComponentProps<typeof ProductCard>["themeFallback"];
  /** Resolved custom badge faces from the global theme. */
  tones?: React.ComponentProps<typeof ProductCard>["tones"];
  /** Rendered in place of the grid when `items` is empty (an `EmptyState`). */
  empty?: ReactNode;
  label?: string;
  className?: string;
}

/** `has` on both identities a caller can reasonably hold. */
function marks(ids: readonly string[] | undefined, product: ProductCardData): boolean {
  if (ids === undefined || ids.length === 0) return false;
  return ids.includes(product.url ?? product.id);
}

function isWishlisted(
  wishlistedIds: readonly string[] | Set<string> | undefined,
  productId: string,
): boolean {
  if (!wishlistedIds) return false;
  if (wishlistedIds instanceof Set) {
    return wishlistedIds.has(productId);
  }
  return wishlistedIds.includes(productId);
}

export default function ProductGrid({
  items,
  pendingIds,
  addedIds,
  onOpen,
  onQuickAdd,
  onQuickView,
  onWishlist,
  wishlistedIds,
  columns,
  themeFallback,
  tones,
  empty,
  label = "Products",
  className = "",
}: ProductGridProps) {
  if (items.length === 0) {
    // An empty grid is not a blank page: the owner's EmptyState is the face that
    // explains it, and rendering nothing would leave the route looking broken.
    return empty ? <>{empty}</> : null;
  }

  const cols = toGridColumns(columns);

  return (
    <ul
      className={`sf-grid ${className}`}
      // A `<ul>` whose markers are removed loses its list semantics in some
      // screen readers; the role states the intent instead of hoping for it.
      role="list"
      aria-label={label}
      style={
        {
          "--grid-cols-phone": cols.phone,
          "--grid-cols-tablet": cols.tablet,
          "--grid-cols-desktop": cols.desktop,
        } as CSSProperties
      }
    >
      {items.map((item) => {
        const wishlisted =
          item.wishlisted !== undefined
            ? item.wishlisted
            : wishlistedIds !== undefined
              ? isWishlisted(wishlistedIds, item.id)
              : undefined;

        const product =
          wishlisted !== undefined ? { ...item, wishlisted } : item;

        return (
          <li
            key={item.url ?? item.id}
            className="sf-grid__cell"
            data-pending={marks(pendingIds, item)}
            data-added={marks(addedIds, item)}
          >
            <ProductCard
              product={product}
              themeFallback={themeFallback}
              tones={tones}
              onOpen={onOpen}
              onQuickAdd={onQuickAdd}
              onQuickView={onQuickView}
              onWishlist={onWishlist}
            />
          </li>
        );
      })}
    </ul>
  );
}
