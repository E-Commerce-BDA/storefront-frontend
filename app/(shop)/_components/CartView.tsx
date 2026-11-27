"use client";

/**
 * CartView — the `/cart` island — sf-051
 * (plan §8; shell-cart.md §4: two surfaces, one reducer)
 *
 * `/cart` and the mini drawer render the *same* store, so this island holds no
 * cart data of its own — it lays out what `CartProvider` already reconciles. The
 * row face is `CartTable`, the arithmetic is `lib/cart/state.ts`, and the only
 * thing owned here is the *submission cadence*.
 *
 * **Qty writes are debounced per line** (shell-cart.md §4). A shopper holding the
 * "+" key intends one final number, not six PATCHes; and a write aimed at a line
 * whose earlier write is still in flight races the server's own total. So each
 * line gets one timer, and while that timer runs the row shows the typed number
 * from a local draft — the stepper must not snap back to the store's stale value
 * mid-think, or the control reads as broken.
 *
 * "Empty cart" is the batch remove v1 can honestly offer.
 */
import { useEffect, useReducer, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button, EmptyState, ErrorState, Icon, Input, LoadingState } from "@/components/ui";
import CartTable from "@/components/shell/CartTable";
import OrderSummaryCard from "@/components/commerce/OrderSummaryCard";
import QuickPromos from "@/components/commerce/QuickPromos";
import { useCart } from "@/app/_components/CartProvider";
import { useWishlist } from "@/app/_components/WishlistProvider";
import { capToStock } from "@/lib/cart/stock";
import { bff } from "@/lib/http/browser";
import { discountAmount } from "@/lib/order/discount";
import {
  discountValidationResultSchema,
  type DiscountValidationResult,
} from "@/lib/order/schemas";
import {
  cartIslandMachine,
  initialCartIslandMachine,
} from "@/lib/cart/viewMachine";

/** The quiet tap before a quantity leaves the island (shell-cart.md §4). */
export const CART_QTY_DEBOUNCE_MS = 350;

export default function CartView() {
  const cart = useCart();
  const wishlist = useWishlist();
  const router = useRouter();
  // sf-086: selection, typed drafts, in-flight writes and the coupon face are
  // one interaction machine; the cart store itself stays the only data source.
  const [view, dispatch] = useReducer(cartIslandMachine, undefined, initialCartIslandMachine);
  const {
    selectedIds: selected,
    drafts: draft,
    pendingIds,
    couponCode,
    couponStatus,
    couponError,
    appliedCoupon,
  } = view;
  const draftRef = useRef(draft);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const couponLoading = couponStatus === "loading";

  // A11: selection ids are scoped to the current cart snapshot. After a GET
  // or a concurrent write, an id that no longer exists must not stay selected.
  useEffect(() => {
    dispatch({ type: "select/prune", ids: cart.items.map((line) => line.id) });
  }, [cart.items]);

  // A navigation away must not strand a timer that PATCHes into a dead tree.
  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((timer) => clearTimeout(timer));
      pending.clear();
    };
  }, []);

  function changeQty(itemId: string, qty: number) {
    const nextDraft = { ...draftRef.current, [itemId]: qty };
    draftRef.current = nextDraft;
    dispatch({ type: "draft/set", id: itemId, qty });

    const running = timers.current.get(itemId);
    if (running !== undefined) clearTimeout(running);

    timers.current.set(
      itemId,
      setTimeout(() => {
        timers.current.delete(itemId);
        const line = cart.items.find((item) => item.id === itemId);
        const finalQty = capToStock(draftRef.current[itemId] ?? qty, line?.stock);
        draftRef.current = { ...draftRef.current, [itemId]: finalQty };
        dispatch({ type: "draft/set", id: itemId, qty: finalQty });
        dispatch({ type: "write/start", id: itemId });
        void cart.setQty(itemId, finalQty).then(() => {
          dispatch({ type: "write/finish", id: itemId });
          const settled = { ...draftRef.current };
          delete settled[itemId];
          draftRef.current = settled;
          dispatch({ type: "draft/delete", id: itemId });
        });
      }, CART_QTY_DEBOUNCE_MS),
    );
  }

  async function applyCoupon(code: string = couponCode) {
    const trimmed = code.trim();
    if (!trimmed) {
      dispatch({ type: "coupon/error", message: "Please enter a coupon code" });
      return;
    }
    dispatch({ type: "coupon/start" });
    try {
      const res = await bff<DiscountValidationResult>("/api/discount-codes/validate", {
        method: "POST",
        body: { code: trimmed, cartTotal: cart.subtotal },
        schema: discountValidationResultSchema,
      });
      if (res.ok && res.data.valid) {
        dispatch({ type: "coupon/success", result: res.data });
      } else {
        const msg =
          res.ok && res.data.message
            ? res.data.message
            : !res.ok && res.message
              ? res.message
              : "Invalid coupon code";
        dispatch({ type: "coupon/error", message: msg });
      }
    } catch {
      dispatch({ type: "coupon/error", message: "Could not validate coupon code" });
    }
  }

  function removeCoupon() {
    dispatch({ type: "coupon/clear" });
  }

  function toggleSelected(itemId: string) {
    dispatch({ type: "select/toggle", id: itemId });
  }

  function toggleAll() {
    dispatch({ type: "select/all", ids: cart.items.map((line) => line.id) });
  }

  async function removeSelected() {
    const ids = [...selected];
    dispatch({ type: "select/set", ids: [] });
    await Promise.all(ids.map((id) => cart.remove(id)));
  }

  async function moveSelected() {
    const lines = cart.items.filter((line) => selected.includes(line.id));
    dispatch({ type: "select/set", ids: [] });
    // A5: a line is removed only when its own wishlist write succeeded. A
    // failed toggle (out of stock, auth, network) must leave the cart intact.
    const moved = await Promise.all(
      lines.map(async (line) => ({
        line,
        ok: await wishlist.toggle(line.productId),
      })),
    );
    await Promise.all(
      moved.filter((entry) => entry.ok).map((entry) => cart.remove(entry.line.id)),
    );
  }

  const selectedLines = cart.items.filter((line) => selected.includes(line.id));

  if (cart.status === "loading" && cart.items.length === 0) {
    return <LoadingState label="Loading your cart…" />;
  }

  // A10: a failed load is not evidence of an empty cart. Show the retry face.
  if (cart.status === "error" && cart.items.length === 0) {
    return (
      <ErrorState
        title="We could not load your cart right now."
        action={
          <Button variant="primary" size="sm" onClick={() => void cart.refresh()}>
            Try again
          </Button>
        }
      />
    );
  }

  if (cart.items.length === 0) {
    return (
      <EmptyState
        icon={<Icon name="shopping-bag" size={22} />}
        title="Your cart is empty"
        body="Nothing here yet — the products page is a good place to start."
        action={
          <Button variant="primary" onClick={() => router.push("/products")}>
            Continue shopping
          </Button>
        }
      />
    );
  }

  // Preview arithmetic is shared with checkout so the two surfaces cannot
  // disagree about what the same code is worth.
  const discount = discountAmount(appliedCoupon, cart.subtotal);

  const displayItems = cart.items.map((line) => ({
    ...line,
    qty: draft[line.id] ?? line.qty,
  }));

  const checkoutUrl = appliedCoupon?.code
    ? `/checkout?coupon=${encodeURIComponent(appliedCoupon.code)}`
    : "/checkout";

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_340px]">
      <div className="min-w-0">
        {selected.length > 0 ? (
          <div
            className="mb-3 flex flex-wrap items-center gap-3 rounded-[var(--radius-md,10px)] border border-[var(--border)] bg-[var(--surface-hover)] px-4 py-3 text-sm"
            role="group"
            aria-label="Selected cart items"
          >
            <span className="font-medium text-[var(--color-ink)]" data-selected-count={selected.length}>
              {selected.length} selected
            </span>
            <Button variant="light" size="sm" onClick={() => void removeSelected()}>
              Remove selected
            </Button>
            <Button variant="light" size="sm" onClick={() => void moveSelected()}>
              Move selected to wishlist
            </Button>
            <Button variant="ghost-ink" size="sm" onClick={() => dispatch({ type: "select/set", ids: [] })}>
              Clear selection
            </Button>
          </div>
        ) : null}
        <CartTable
          items={displayItems}
          pending={Object.fromEntries(pendingIds.map((id) => [id, true]))}
          onQty={changeQty}
          onRemove={(itemId) => void cart.remove(itemId)}
          selectedIds={selected}
          onToggleSelected={toggleSelected}
          onToggleAll={toggleAll}
        />
        {selectedLines.length > 0 ? (
          <span className="sr-only" aria-live="polite">
            {selectedLines.map((line) => line.productName).join(", ")} selected
          </span>
        ) : null}
      </div>

      <OrderSummaryCard
        className="sf-cart__summary"
        subtotal={cart.subtotal}
        discount={discount}
        coupon={
          appliedCoupon
            ? { code: appliedCoupon.code ?? couponCode.trim(), discount }
            : undefined
        }
        onRemoveCoupon={appliedCoupon ? removeCoupon : undefined}
        action={
          <div className="sf-summary__stack">
            <div className="sf-summary__coupon">
              <label
                htmlFor="cart-coupon-input"
                className="sf-summary__coupon-label"
              >
                Discount code
              </label>
              <div className="sf-summary__coupon-row">
                <Input
                  id="cart-coupon-input"
                  value={couponCode}
                  onChange={(value) => dispatch({ type: "coupon/type", code: value })}
                  placeholder="Enter code"
                  size="sm"
                  disabled={couponLoading || !!appliedCoupon}
                />
                <Button
                  variant="light"
                  size="sm"
                  onClick={() => void applyCoupon()}
                  disabled={couponLoading || !couponCode.trim() || !!appliedCoupon}
                >
                  {couponLoading ? "Applying…" : "Apply"}
                </Button>
              </div>
              <QuickPromos
                applied={appliedCoupon?.code}
                onPick={(code) => {
                  dispatch({ type: "coupon/type", code });
                  void applyCoupon(code);
                }}
              />
              {couponError ? (
                <p className="sf-summary__coupon-error" role="alert">
                  {couponError}
                </p>
              ) : null}
            </div>
            <Button fullWidth onClick={() => router.push(checkoutUrl)}>
              Checkout
            </Button>
            <Button variant="ghost-ink" fullWidth onClick={() => void cart.clear()}>
              Empty cart
            </Button>
            <Button variant="light" fullWidth onClick={() => router.push("/products")}>
              Continue shopping
            </Button>
          </div>
        }
      />
    </div>
  );
}
