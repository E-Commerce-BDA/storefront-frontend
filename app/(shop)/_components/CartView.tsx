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
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, EmptyState, Icon, Input } from "@/components/ui";
import CartTable from "@/components/shell/CartTable";
import { useCart } from "@/app/_components/CartProvider";
import { bff } from "@/lib/http/browser";
import { discountAmount, totalAfterDiscount } from "@/lib/order/discount";
import {
  discountValidationResultSchema,
  type DiscountValidationResult,
} from "@/lib/order/schemas";

/** The quiet tap before a quantity leaves the island (shell-cart.md §4). */
export const CART_QTY_DEBOUNCE_MS = 350;

export default function CartView() {
  const cart = useCart();
  const router = useRouter();

  /** Typed-but-unsubmitted quantities, keyed by line id (see header note). */
  const [draft, setDraft] = useState<Record<string, number>>({});
  const draftRef = useRef(draft);
  const [inFlight, setInFlight] = useState<Record<string, boolean>>({});
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<DiscountValidationResult | null>(null);

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
    setDraft(nextDraft);

    const running = timers.current.get(itemId);
    if (running !== undefined) clearTimeout(running);

    timers.current.set(
      itemId,
      setTimeout(() => {
        timers.current.delete(itemId);
        const finalQty = draftRef.current[itemId] ?? qty;
        setInFlight((prev) => ({ ...prev, [itemId]: true }));
        void cart.setQty(itemId, finalQty).then(() => {
          setInFlight((prev) => ({ ...prev, [itemId]: false }));
          const settled = { ...draftRef.current };
          delete settled[itemId];
          draftRef.current = settled;
          setDraft(settled);
        });
      }, CART_QTY_DEBOUNCE_MS),
    );
  }

  async function applyCoupon() {
    const trimmed = couponCode.trim();
    if (!trimmed) {
      setCouponError("Please enter a coupon code");
      return;
    }
    setCouponLoading(true);
    setCouponError(null);
    try {
      const res = await bff<DiscountValidationResult>("/api/discount-codes/validate", {
        method: "POST",
        body: { code: trimmed, cartTotal: cart.subtotal },
        schema: discountValidationResultSchema,
      });
      if (res.ok && res.data.valid) {
        setAppliedCoupon(res.data);
        setCouponError(null);
      } else {
        const msg =
          res.ok && res.data.message
            ? res.data.message
            : !res.ok && res.message
              ? res.message
              : "Invalid coupon code";
        setCouponError(msg);
        setAppliedCoupon(null);
      }
    } catch {
      setCouponError("Could not validate coupon code");
    } finally {
      setCouponLoading(false);
    }
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError(null);
  }

  if (cart.status === "loading" && cart.items.length === 0) {
    return (
      <p className="text-sm text-[var(--text-muted)]" role="status">
        Loading your cart…
      </p>
    );
  }

  if (cart.items.length === 0) {
    return (
      <EmptyState
        icon={<Icon name="shopping-bag" size={22} />}
        title="Your cart is empty"
        body="Nothing here yet — the products page is a good place to start."
        action={
          <Button variant="light" onClick={() => router.push("/products")}>
            Continue shopping
          </Button>
        }
      />
    );
  }

  // Preview arithmetic is shared with checkout so the two surfaces cannot
  // disagree about what the same code is worth.
  const discount = discountAmount(appliedCoupon, cart.subtotal);
  const estimatedTotal = totalAfterDiscount(cart.subtotal, discount);

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
        <CartTable
          items={displayItems}
          pending={inFlight}
          onQty={changeQty}
          onRemove={(itemId) => void cart.remove(itemId)}
        />
      </div>

      <aside className="flex flex-col gap-5 self-start rounded-[var(--radius-md,10px)] border border-[var(--border)] bg-[var(--surface-raised,var(--surface))] p-5 shadow-sm">
        <h2 className="m-0 text-base font-semibold text-[var(--color-ink)]">
          Summary ({cart.count} {cart.count === 1 ? "item" : "items"})
        </h2>

        <div className="grid gap-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-muted)]">Subtotal</span>
            <span className="font-medium text-[var(--color-ink)]">${cart.subtotal}</span>
          </div>

          {appliedCoupon ? (
            <div className="flex items-center justify-between text-[var(--color-success,#27ae60)]">
              <span className="flex items-center gap-1.5">
                <span>Coupon ({appliedCoupon.code})</span>
                <button
                  type="button"
                  onClick={removeCoupon}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--color-danger,#e74c3c)] underline"
                  aria-label="Remove coupon"
                >
                  Remove
                </button>
              </span>
              <span className="font-medium">-${discount}</span>
            </div>
          ) : null}

          <div className="flex items-baseline justify-between border-t border-[var(--border)] pt-3 text-base font-semibold">
            <span className="text-[var(--color-ink)]">Estimated Total</span>
            <span className="text-lg text-[var(--color-ink)]">${estimatedTotal}</span>
          </div>
        </div>

        {/* Coupon code input */}
        <div className="border-t border-[var(--border)] pt-4">
          <label
            htmlFor="cart-coupon-input"
            className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2"
          >
            Discount code
          </label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                id="cart-coupon-input"
                value={couponCode}
                onChange={(val) => setCouponCode(val)}
                placeholder="Enter code"
                size="sm"
                disabled={couponLoading || !!appliedCoupon}
              />
            </div>
            <Button
              variant="light"
              size="sm"
              onClick={() => void applyCoupon()}
              disabled={couponLoading || !couponCode.trim() || !!appliedCoupon}
            >
              {couponLoading ? "Applying…" : "Apply"}
            </Button>
          </div>
          {couponError ? (
            <p className="mt-1.5 text-xs text-[var(--color-danger,#c0392b)]" role="alert">
              {couponError}
            </p>
          ) : null}
          {appliedCoupon ? (
            <p className="mt-1.5 text-xs text-[var(--color-success,#27ae60)]">
              Coupon {appliedCoupon.code} applied!
            </p>
          ) : null}
        </div>

        <div className="grid gap-2 pt-2">
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
      </aside>
    </div>
  );
}
