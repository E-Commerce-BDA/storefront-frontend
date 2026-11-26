"use client";

/**
 * PurchasePanel — the PDP's one client boundary — sf-051
 * (plan §8 route table: `/products/[slug]/_components/PurchasePanel.tsx`)
 *
 * The gallery, variant selector and stepper are all strictly controlled dumb
 * blocks, so *something* has to own their state, and this is that something: the
 * active frame, the option selection, the quantity, and the add-to-cart action.
 * The page is a server component; it maps the detail row to plain props and hands
 * them here.
 *
 * Product title (h1) lives in the right column above ratings, price and buy box.
 */
import { useEffect, useMemo, useReducer } from "react";
import { useVariantFromURL } from "@/app/hooks/useVariantFromURL";
import Gallery from "@/components/commerce/Gallery";
import VariantSelector from "@/components/commerce/VariantSelector";
import WishlistButton from "@/components/commerce/WishlistButton";
import QuantityStepper from "@/components/ui/QuantityStepper";
import Button from "@/components/ui/Button";
import { useCart } from "@/app/_components/CartProvider";
import { clampQty, QTY_LIMITS } from "@/lib/commerce/quantity";
import { resolveVariant, selectionOptions } from "@/lib/commerce/variants";
import type { GalleryImage } from "@/lib/commerce/gallery";
import type { ResolvedPhotoSettings } from "@/lib/commerce/photoSettings";
import type { ProductOptionDto, ProductVariantDto } from "@/lib/catalog/schemas";
import { initialPdpMachine, pdpMachine } from "@/lib/pdp/machine";

// Trust now renders as a `pdp_trust` CMS section below the buy box; the
// static list survives only as the outage fallback in `lib/sections/pdp.ts`.

export interface PurchasePanelProps {
  productId: string;
  name: string;
  images: GalleryImage[];
  options: ProductOptionDto[];
  variants: ProductVariantDto[];
  /** Effective-or-list price — what shows until a variant overrides it. */
  price: number;
  /** Product-level compare-at; a variant has none, so this is the only source. */
  compareAt?: number | null;
  /** Product stock, the fallback when the product carries no variants. */
  stock: number;
  rating?: number | null;
  ratingCount?: number | null;
  /** PDP photo paint, resolved product > section > global by the route. */
  photoSettings?: ResolvedPhotoSettings;
}

export default function PurchasePanel({
  productId,
  name,
  images,
  options,
  variants,
  price,
  compareAt = null,
  stock,
  rating,
  ratingCount,
  photoSettings,
}: PurchasePanelProps) {
  const cart = useCart();
  const [pdp, dispatch] = useReducer(pdpMachine, undefined, () =>
    initialPdpMachine(productId),
  );
  const { qty, galleryIndex: activeIndex } = pdp;
  const setActiveIndex = (index: number) =>
    dispatch({ type: "gallery/set", index, count: images.length });
  // A22: Next reuses this component across [slug] navigations; qty and gallery
  // are product-scoped and must reset when the product id changes.
  useEffect(() => {
    dispatch({ type: "product/change", productId });
  }, [productId]);
  const { selection, notice, select } = useVariantFromURL(options, variants);

  const variant = useMemo(
    () => (variants.length > 0 ? resolveVariant(variants, selection) : null),
    [variants, selection],
  );

  const displayed = variant ? variant.price : price;
  const available = variant ? variant.stock : stock;
  const outOfStock = available <= 0;
  const effQty = outOfStock ? 1 : clampQty(qty, { min: QTY_LIMITS.min, max: available });

  // Compare-at only paints above the shown price (the card's rule) — a
  // strikethrough equal to the price would advertise a sale that is not there.
  const showCompare =
    compareAt !== null && compareAt !== undefined && compareAt > displayed;

  const optionViews = useMemo(
    () => selectionOptions(options, variants, selection),
    [options, variants, selection],
  );

  async function addToCart() {
    const ok = await cart.add(productId, {
      variantId: variant?.id,
      qty: effQty,
    });
    if (ok) cart.openDrawer();
  }

  return (
    <div className="sf-pdp">
      <Gallery
        images={images}
        activeIndex={activeIndex}
        onIndexChange={setActiveIndex}
        {...(photoSettings?.ratio !== undefined && photoSettings.ratio !== "custom"
          ? { ratio: photoSettings.ratio }
          : {})}
        {...(photoSettings?.layout !== undefined ? { layout: photoSettings.layout } : {})}
        {...(photoSettings?.gutter !== undefined ? { gutterPx: photoSettings.gutter } : {})}
        {...(photoSettings?.widthPercent !== undefined
          ? { widthPercent: photoSettings.widthPercent }
          : {})}
        {...(photoSettings?.blendMode !== undefined ? { blendMode: photoSettings.blendMode } : {})}
        {...(photoSettings?.showPhotos !== undefined ? { showPhotos: photoSettings.showPhotos } : {})}
      />

      <div className="flex flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <h1 className="sf-title sf-pdp__title">
            {name}
          </h1>
          <WishlistButton productId={productId} />
        </div>

        {rating != null && ratingCount != null && ratingCount > 0 ? (
          <a
            href="#reviews"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--color-ink)]"
          >
            <span className="flex items-center text-[var(--color-sale-text)]" aria-hidden="true">
              ★
            </span>
            <span className="font-semibold text-[var(--color-ink)]">
              {rating.toFixed(1)}
            </span>
            <span>({ratingCount} {ratingCount === 1 ? "review" : "reviews"})</span>
          </a>
        ) : null}

        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-semibold text-[var(--color-ink)]">${displayed}</span>
          {showCompare ? (
            <s className="text-base text-[var(--text-muted)]">${compareAt}</s>
          ) : null}
        </div>

        {notice ? (
          <p className="text-sm text-[var(--text-muted)]" role="status">
            We picked the closest available option for you.
          </p>
        ) : null}

        {options.length > 0 ? (
          <VariantSelector
            options={optionViews}
            selected={selection}
            onSelect={select}
            disabled={outOfStock}
          />
        ) : null}

        {outOfStock ? (
          <p className="text-sm font-medium text-[var(--text-muted)]">Out of stock</p>
        ) : (
          <QuantityStepper
            value={effQty}
            min={QTY_LIMITS.min}
            max={available}
            onChange={(next) =>
              dispatch({
                type: "qty/set",
                qty: next,
                minQty: QTY_LIMITS.min,
                maxQty: Math.max(available, QTY_LIMITS.min),
              })
            }
            label={`${name} quantity`}
          />
        )}

        <Button onClick={() => void addToCart()} disabled={outOfStock}>
          {outOfStock ? "Unavailable" : "Add to cart"}
        </Button>
      </div>
    </div>
  );
}
