"use client";

import { useEffect, useMemo, useReducer, useRef } from "react";
import Link from "next/link";
import { Button, Dialog, Icon, QuantityStepper } from "@/components/ui";
import WishlistButton from "@/components/commerce/WishlistButton";
import type { ProductCardData } from "@/lib/commerce/productCard";
import {
  getDefaultQuickViewOptions,
  resolveQuickViewSelection,
} from "@/lib/commerce/quickView";
import { initialOverlayMachine, overlayMachine } from "@/lib/overlay/machine";

export interface QuickViewDialogProps {
  product: ProductCardData | null;
  open: boolean;
  onClose: () => void;
  /** Returns whether the write succeeded — success copy is never assumed. */
  onAddToCart?: (
    productId: string,
    variantId?: string,
    qty?: number,
  ) => Promise<boolean> | boolean;
}

export default function QuickViewDialog({
  product,
  open,
  onClose,
  onAddToCart,
}: QuickViewDialogProps) {
  // sf-086: variant, qty, image and add face are one reducer. The timer below
  // only schedules the transient "Added" face to decay — it stores no state.
  const [view, dispatch] = useReducer(overlayMachine, undefined, () => {
    const base = initialOverlayMachine();
    return product === null
      ? base
      : overlayMachine(base, {
          type: "selection/reset",
          options: getDefaultQuickViewOptions(product),
        });
  });
  const { selectedOptions, qty: quantity, imageIndex: selectedImageIndex, status, message } = view;
  const adding = status === "loading";
  const added = status === "success";
  // A19/A20: a failure face is part of state, never a silent undo.
  const addError = status === "error" ? message : null;
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const timer = addedTimer;
    return () => {
      if (timer.current !== null) clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => {
    if (product && open) {
      dispatch({
        type: "selection/reset",
        options: getDefaultQuickViewOptions(product),
      });
    }
  }, [product, open]);

  const resolved = useMemo(() => {
    if (!product) return null;
    return resolveQuickViewSelection(product, selectedOptions);
  }, [product, selectedOptions]);

  const productName = product?.name ?? (product as { title?: string } | null)?.title ?? "Product";
  const productImage = product?.image ?? (product as { imageUrl?: string } | null)?.imageUrl ?? "";

  const images = useMemo(() => {
    if (!product) return [];
    if (product.images && product.images.length > 0) {
      return product.images;
    }
    return productImage ? [{ url: productImage, alt: productName }] : [];
  }, [product, productImage, productName]);

  if (!open || !product || !resolved) return null;

  const activeImageUrl =
    resolved.imageUrl || images[selectedImageIndex]?.url || productImage;

  const detailUrl =
    product.url || `/products/${product.id}`;

  async function handleAdd() {
    if (!product || !resolved || !resolved.inStock) return;
    dispatch({ type: "add/start" });
    try {
      const ok = onAddToCart
        ? await onAddToCart(product.id, resolved.variantId, quantity)
        : true;
      if (ok) {
        dispatch({ type: "add/success" });
        if (addedTimer.current !== null) clearTimeout(addedTimer.current);
        addedTimer.current = setTimeout(() => dispatch({ type: "add/reset" }), 2000);
        return;
      }
    } catch {
      // A thrown write is a failure face too — never leave the button spinning.
    }
    // A7/A19: no success face, no drawer — just an honest failure.
    dispatch({ type: "add/error", message: "We could not add that item. Please try again." });
  }

  const discountPercent =
    resolved.compareAt && resolved.compareAt > resolved.price
      ? Math.round(((resolved.compareAt - resolved.price) / resolved.compareAt) * 100)
      : null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={720}
      className="p-0 overflow-hidden"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        {/* Gallery column */}
        <div className="flex flex-col gap-3">
          <div className="relative aspect-square w-full overflow-hidden rounded-[var(--radius-md,10px)] bg-[var(--surface-muted)]">
            {activeImageUrl ? (
              <img
                src={activeImageUrl}
                alt={productName}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[var(--text-muted)]">
                <Icon name="shopping-bag" size={48} />
              </div>
            )}
            {discountPercent ? (
              <span className="absolute top-3 left-3 rounded-full bg-[var(--color-sale-text)] px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                Sale {discountPercent}%
              </span>
            ) : null}
          </div>

          {images.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Product thumbnails">
              {images.map((img, idx) => (
                <button
                  key={img.url || idx}
                  type="button"
                  onClick={() => dispatch({ type: "image/set", index: idx, count: images.length })}
                  data-selected={selectedImageIndex === idx}
                  className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[var(--radius-sm,6px)] border-2"
                  style={{
                    // Selection is a solid var-backed face, not an opacity
                    // dimmer: fading the unselected image loses its detail.
                    borderColor: selectedImageIndex === idx ? "var(--color-navy)" : "var(--border)",
                    background: selectedImageIndex === idx ? "var(--surface-raised)" : "var(--surface-muted)",
                  }}
                  aria-label={`View image ${idx + 1}`}
                >
                  <img
                    src={img.url}
                    alt={img.alt ?? `Thumbnail ${idx + 1}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Info & Purchase column */}
        <div className="flex flex-col justify-between gap-4">
          <div className="flex flex-col gap-3">
            {product.brand ? (
              <span className="text-xs font-semibold tracking-wider uppercase text-[var(--text-muted)]">
                {product.brand.name}
              </span>
            ) : null}

            <div className="flex items-start justify-between gap-2">
              <h2 className="m-0 text-xl font-bold text-[var(--color-ink)]">
                {productName}
              </h2>
              <WishlistButton productId={product.id} />
            </div>

            {/* Ratings */}
            {product.rating ? (
              <div className="flex items-center gap-1.5 text-sm text-[var(--text-muted)]">
                <div className="flex text-amber-500">
                  <Icon name="star" size={16} />
                </div>
                <span className="font-medium text-[var(--color-ink)]">
                  {product.rating.toFixed(1)}
                </span>
                {product.ratingCount ? (
                  <span>({product.ratingCount})</span>
                ) : null}
              </div>
            ) : null}

            {/* Price & Stock */}
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold text-[var(--color-ink)]">
                ${resolved.price}
              </span>
              {resolved.compareAt && resolved.compareAt > resolved.price ? (
                <span className="text-base text-[var(--text-muted)] line-through">
                  ${resolved.compareAt}
                </span>
              ) : null}
              <span
                className={`ml-auto text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  resolved.inStock
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-700"
                }`}
              >
                {resolved.inStock ? "In stock" : "Out of stock"}
              </span>
            </div>

            {/* Options (swatches and pills) */}
            {product.options && product.options.length > 0 ? (
              <div className="grid gap-3 pt-2">
                {product.options.map((opt) => (
                  <div key={opt.id ?? opt.name} className="grid gap-1.5">
                    <span className="text-xs font-medium text-[var(--text-muted)]">
                      {opt.name}:{" "}
                      <strong className="text-[var(--color-ink)]">
                        {selectedOptions[opt.name] ?? "None"}
                      </strong>
                    </span>

                    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={opt.name}>
                      {opt.values.map((val) => {
                        const isSelected = selectedOptions[opt.name] === val.value;

                        if (opt.displayType === "swatch") {
                          const bg = val.swatchHex || "#cbd5e1";
                          return (
                            <button
                              key={val.value}
                              type="button"
                              role="radio"
                              aria-checked={isSelected}
                              aria-label={`${opt.name} ${val.value}`}
                              onClick={() =>
                                dispatch({ type: "selection/set", name: opt.name, value: val.value })
                              }
                              className={`h-7 w-7 rounded-full transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                                isSelected
                                  ? "scale-110 ring-2 ring-[var(--color-navy,#1a202c)] ring-offset-2"
                                  : "hover:scale-105 opacity-80 hover:opacity-100"
                              }`}
                              style={{ backgroundColor: bg }}
                            />
                          );
                        }

                        // Default or pill
                        return (
                          <button
                            key={val.value}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            onClick={() =>
                              dispatch({ type: "selection/set", name: opt.name, value: val.value })
                            }
                            className={`px-3 py-1 text-xs font-medium rounded-[var(--radius-sm,6px)] border transition-colors ${
                              isSelected
                                ? "border-[var(--color-navy,#1a202c)] bg-[var(--color-navy,#1a202c)] text-white"
                                : "border-[var(--border)] bg-[var(--surface)] text-[var(--color-ink)] hover:border-[var(--border-strong)]"
                            }`}
                          >
                            {val.value}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* Quantity and Actions */}
          <div className="grid gap-3 pt-3 border-t border-[var(--border)]">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--color-ink)]">Quantity</span>
              <QuantityStepper
                value={quantity}
                min={1}
                max={99}
                onChange={(value) =>
                  dispatch({ type: "qty/set", qty: value, min: 1, max: 99 })
                }
                disabled={!resolved.inStock || adding}
                label={`${productName} quantity`}
              />
            </div>

            {addError ? (
              <p className="m-0 text-sm text-[var(--color-ink)]" role="alert">
                {addError}
              </p>
            ) : null}
            <Button
              fullWidth
              onClick={() => void handleAdd()}
              disabled={!resolved.inStock || adding}
            >
              {added
                ? "Added to bag!"
                : adding
                  ? "Adding…"
                  : resolved.inStock
                    ? "Add to bag"
                    : "Out of stock"}
            </Button>

            <Link
              href={detailUrl}
              onClick={onClose}
              className="text-center text-xs font-medium text-[var(--text-muted)] hover:text-[var(--color-ink)] underline"
            >
              View full details &rarr;
            </Link>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
