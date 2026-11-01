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
 * Three rules the panel is responsible for:
 *
 * 1. **Price/stock follow the resolved variant, not the row.** `resolveVariant`
 *    picks the variant a full selection names (purchasable preferred); a product
 *    with no fully-resolved variant falls back to the product's own effective
 *    price and stock. Two faces of one product must not disagree about its price.
 * 2. **The add path is the store, once.** `cart.add()` is already optimistic and
 *    reverts-with-toast on failure, so the panel awaits its boolean and opens the
 *    drawer on success — no parallel fetch, no second optimistic write.
 * 3. **Quantity is reeled in when the variant changes.** A shopper who picked "3"
 *    then switches to a variant with 1 left must not POST a qty the service will
 *    reject; `clampQty` bounds the *shown* number so display and submit agree.
 */
import { useMemo, useState } from "react";
import Gallery from "@/components/commerce/Gallery";
import VariantSelector from "@/components/commerce/VariantSelector";
import QuantityStepper from "@/components/ui/QuantityStepper";
import Button from "@/components/ui/Button";
import { useCart } from "@/app/_components/CartProvider";
import { clampQty, QTY_LIMITS } from "@/lib/commerce/quantity";
import {
  defaultSelection,
  resolveVariant,
  selectionOptions,
  type VariantSelection,
} from "@/lib/commerce/variants";
import type { GalleryImage } from "@/lib/commerce/gallery";
import type { ProductOptionDto, ProductVariantDto } from "@/lib/catalog/schemas";

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
}: PurchasePanelProps) {
  const cart = useCart();
  const [activeIndex, setActiveIndex] = useState(0);
  const [selection, setSelection] = useState<VariantSelection>(() =>
    defaultSelection(options, variants),
  );
  const [qty, setQty] = useState(1);

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
    <div className="grid gap-8 md:grid-cols-2">
      <Gallery images={images} activeIndex={activeIndex} onIndexChange={setActiveIndex} />

      <div className="flex flex-col gap-5">
        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-semibold text-[var(--color-ink)]">${displayed}</span>
          {showCompare ? (
            <s className="text-base text-[var(--text-muted)]">${compareAt}</s>
          ) : null}
        </div>

        {options.length > 0 ? (
          <VariantSelector
            options={optionViews}
            selected={selection}
            onSelect={(optionName, valueId) =>
              setSelection((prev) => ({ ...prev, [optionName]: valueId }))
            }
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
            onChange={setQty}
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
