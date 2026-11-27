"use client";

/**
 * CheckoutForm — the `/checkout` island — sf-051
 * (plan §8: store + `POST /api/checkout`; A5.4–A5.7)
 *
 * Two jobs, and the seam owns both:
 *
 * 1. **The attempt.** The body is built from the live cart store, the
 *    idempotency pair comes from `lib/checkout/idempotency.ts`, and the error
 *    table (plan §8) is resolved by the pure `describeFailure` below — so the
 *    copy a shopper reads for `STOCK_INSUFFICIENT` vs `503` is one testable
 *    function, not six inline ternaries. "Nothing was charged" is only honest
 *    when the same key rides the retry; `retryWithSameKey` says which banners
 *    that covers, and a *changed* body mints a new key exactly like any first
 *    submit would.
 * 2. **The handoff.** Success is not a page state, it is a *destination*: empty
 *    the cart (the server already did), then navigate to
 *    `/checkout/confirmation/[orderId]`, which re-reads the order through the
 *    BFF. The confirmation page never trusts memory of the POST body — G4
 *    checks the order over HTTP, so the island must survive a refresh, which
 *    only a real route with a real id can do.
 *
 * An empty cart bounces to `/cart` — checkout with nothing in it is the cart's
 * empty state, not a second empty state invented here. Saved addresses and
 * shipping methods are sf-058; one mock payment provider is all v1 can honestly
 * offer (the plan's A5.5), so the select has exactly one real option.
 */
import { useEffect, useReducer, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Checkbox, ErrorState, Input, LoadingState, Select, Textarea } from "@/components/ui";
import CartLineItem from "@/components/shell/CartLineItem";
import CheckoutSteps from "@/components/shell/CheckoutSteps";
import { fetchAddresses } from "@/lib/account/port";
import { resolveCheckoutSteps } from "@/lib/checkout/steps";
import { useCart } from "@/app/_components/CartProvider";
import { bff } from "@/lib/http/browser";
import { isPendingId } from "@/lib/cart/state";
import type { ServiceFailure } from "@/lib/http/result";
import {
  checkoutConfirmationSchema,
  discountValidationResultSchema,
  type CheckoutConfirmationDto,
  type CheckoutInput,
  type DiscountValidationResult,
} from "@/lib/order/schemas";
import { discountAmount, totalAfterDiscount } from "@/lib/order/discount";
import { nextKey, type IdemPair } from "@/lib/checkout/idempotency";
import { isShortLine, resolveShortfall } from "@/lib/checkout/shortfall";
import { checkoutMachine, initialCheckoutMachine, shouldBounceToCart } from "@/lib/checkout/machine";
import {
  checkoutFieldsMachine,
  initialCheckoutFields,
  stripAddress,
} from "@/lib/checkout/fieldsMachine";
import type { StockShortfall } from "@/lib/order/schemas";

/** `describeFailure` input: a failure plus the status it arrived with. */
export interface CheckoutCopy {
  message: string;
  /** CTA to `/cart` (stock) — the shopper must fix the basket, not re-pay. */
  toCart: boolean;
  /** Rot the key: order-svc closed this attempt; the next submit is new. */
  rotateKey: boolean;
  /** Auto-retry with the *same* key (IN_PROGRESS polls twice at 1 s). */
  retryWithSameKey: boolean;
  /** ord-013: structured ids from the 409, or null when the service sent none. */
  shortfall: StockShortfall | null;
}

/**
 * The plan §8 table as a function. Codes not named by the table fall to their
 * `kind`'s generic copy — an unmapped 503 still deserves "nothing was
 * charged", and an unmapped 400 must never claim an order exists.
 */
export function describeFailure(failure: ServiceFailure): CheckoutCopy {
  // A transport-level failure (TIMEOUT, NETWORK_ERROR) can carry a null code —
  // the kind fallbacks below still pick honest copy for it.
  const code = failure.code ?? "";
  if (code.startsWith("STOCK_") || code.startsWith("RESERVATION_")) {
    // The 409 carries no item ids, so no line is blamed (A5.7) — the banner
    // sends the shopper to the cart, which is where the truth is editable.
    return {
      message: "Some items are no longer available.",
      toCart: true,
      rotateKey: false,
      retryWithSameKey: false,
      shortfall: resolveShortfall(failure.details),
    };
  }
  if (code === "IDEMPOTENCY_CONFLICT" || code === "ORDER_ATTEMPT_CLOSED") {
    return { message: "Your attempt was closed — submit again.", toCart: false, rotateKey: true, retryWithSameKey: false, shortfall: null };
  }
  if (code === "IDEMPOTENCY_IN_PROGRESS") {
    return { message: "Your order is still being processed…", toCart: false, rotateKey: false, retryWithSameKey: true, shortfall: null };
  }
  if (failure.kind === "upstream") {
    return { message: "Payment could not be completed.", toCart: false, rotateKey: false, retryWithSameKey: false, shortfall: null };
  }
  if (failure.kind === "unavailable") {
    return { message: "Nothing was charged — try again.", toCart: false, rotateKey: false, retryWithSameKey: false, shortfall: null };
  }
  if (failure.kind === "invalid") {
    return { message: failure.message || "The order details need a fix.", toCart: false, rotateKey: false, retryWithSameKey: false, shortfall: null };
  }
  return { message: "Checkout is unavailable right now.", toCart: false, rotateKey: false, retryWithSameKey: false, shortfall: null };
}

/** Quiet window before a typed coupon is re-validated (cart mirror). */
export const CHECKOUT_COUPON_DEBOUNCE_MS = 250;

/** IN_PROGRESS patience — the plan names the cadence, not a guess. */
export const IN_PROGRESS_RETRY_MS = 1000;
const IN_PROGRESS_MAX_RETRIES = 2;

/** Details is the active step on /checkout; the chrome never navigates. */
const STEPS = resolveCheckoutSteps(1);

// Static v1 list, not CMS/settings-sourced. The order service accepts any
// 2-letter country code; this short list is an honest v1 checkout boundary,
// not storefront content.
const COUNTRY_OPTIONS = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "GB", label: "United Kingdom" },
  { value: "DE", label: "Germany" },
  { value: "AU", label: "Australia" },
  { value: "SG", label: "Singapore" },
  { value: "IN", label: "India" },
];

export default function CheckoutForm() {
  const cart = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCoupon = searchParams.get("coupon") ?? "";
  // sf-080: coupon, banner and submit state are one machine, not five locals
  // that can disagree about whether a write is still in flight.
  const [machine, dispatch] = useReducer(checkoutMachine, undefined, () => ({
    ...initialCheckoutMachine(),
    discountCode: initialCoupon,
  }));
  const { discountCode, couponResult: discountResult, couponError, banner, submitting } = machine;

  // The cart previews a coupon and sends only its code here. Re-validate it
  // against the same endpoint so the summary's discount line is the one the
  // cart showed — never a dollar amount copied from an editable query string.
  useEffect(() => {
    const code = discountCode.trim();
    if (code === "") return;
    let alive = true;
    const timer = setTimeout(() => {
      void bff<DiscountValidationResult>("/api/discount-codes/validate", {
        method: "POST",
        body: { code, cartTotal: cart.subtotal },
        schema: discountValidationResultSchema,
      })
        .then((res) => {
          if (!alive) return;
          if (res?.ok && res.data.valid) {
            dispatch({ type: "coupon/valid", result: res.data });
          } else if (res?.ok) {
            // A9: a 200 with valid:false is an answer, not silence — say so.
            dispatch({ type: "coupon/invalid", message: "That code is not valid for this order." });
          } else {
            dispatch({ type: "coupon/invalid", message: res.message ?? "We could not check that code." });
          }
        })
        .catch(() => {
          if (alive) dispatch({ type: "coupon/invalid", message: "We could not check that code." });
        });
    }, CHECKOUT_COUPON_DEBOUNCE_MS);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [discountCode, cart.subtotal]);

  // sf-086: every editable field is one machine. The submit machine above owns
  // only the attempt, so a 409 never rewrites the shopper's address.
  const [fields, fieldsDispatch] = useReducer(
    checkoutFieldsMachine,
    undefined,
    initialCheckoutFields,
  );
  const {
    savedAddresses,
    selectedAddress,
    shippingMethod,
    shipping,
    sameBilling,
    billing,
    notes,
  } = fields;

  // Saved addresses are a convenience, not a requirement: a guest or a failed
  // read simply sees the empty "use a new address" option.
  useEffect(() => {
    let alive = true;
    void fetchAddresses().then((res) => {
      if (alive && res.ok) fieldsDispatch({ type: "addresses/success", addresses: res.data });
    });
    return () => {
      alive = false;
    };
  }, []);

  function pickAddress(id: string) {
    fieldsDispatch({ type: "address/select", id });
  }

  /** The one key per logical attempt — a ref because a re-render must never reset it. */
  const attempt = useRef<IdemPair | null>(null);

  // A1: the cart's status is mirrored into the island machine so only a
  // settled `ready` answer can bounce to /cart. A cold load ("idle") and a
  // failed load ("error") keep the checkout face and show their own state.
  useEffect(() => {
    if (cart.status === "loading") dispatch({ type: "load/start" });
    else if (cart.status === "error") dispatch({ type: "load/error" });
    else if (cart.status === "ready") {
      dispatch({ type: "load/success", itemCount: cart.items.length });
    }
  }, [cart.status, cart.items.length]);

  const settledEmpty = shouldBounceToCart(machine, cart.items.length);
  useEffect(() => {
    if (settledEmpty) router.replace("/cart");
  }, [settledEmpty, router]);

  function buildBody(): CheckoutInput | null {
    // A placeholder line has no server id and its qty is a lie until reconcile.
    if (cart.items.some((line) => isPendingId(line.id))) return null;
    return {
      items: cart.items.map((line) => ({
        productId: line.productId,
        variantId: line.variantId ?? undefined,
        qty: line.qty,
      })),
      shippingAddress: stripAddress(shipping),
      billingAddress: stripAddress(sameBilling ? shipping : billing),
      discountCode: discountCode.trim() === "" ? undefined : discountCode.trim(),
      payment: { provider: "mock" },
      notes: notes.trim() === "" ? undefined : notes.trim(),
    };
  }

  async function submit() {
    if (submitting) return;
    const body = buildBody();
    if (body === null) return;

    dispatch({ type: "submit/start" });
    // Same body across retries → same key; edited basket → fresh key. `nextKey`
    // is both decisions in one call.
    attempt.current = nextKey(attempt.current, body, () => crypto.randomUUID());

    try {
      let result = await postCheckout(body, attempt.current.key);

      // The plan's cadence, not an invention: poll an in-progress attempt twice
      // at 1 s with the *same* key before telling the shopper to wait.
      let waits = 0;
      while (
        !result.ok &&
        result.code === "IDEMPOTENCY_IN_PROGRESS" &&
        waits < IN_PROGRESS_MAX_RETRIES
      ) {
        await new Promise((resolve) => setTimeout(resolve, IN_PROGRESS_RETRY_MS));
        waits += 1;
        result = await postCheckout(body, attempt.current.key);
      }

      if (result.ok) {
        // The server emptied the cart while it created the order; mirror that
        // locally so the badge is right before the navigation paints.
        await cart.clear();
        router.push(`/checkout/confirmation/${encodeURIComponent(result.data.orderId)}`);
      } else if (result.kind === "unauthorized") {
        // A 401 survived bff's one refresh-and-replay — the session is really
        // gone. The proxy guards the page, but a long-open tab can expire
        // before the submit (plan §8: route, don't render a dead form).
        router.push(`/signin?next=${encodeURIComponent("/checkout")}`);
      } else {
        const copy = describeFailure(result);
        if (copy.rotateKey) attempt.current = null;
        dispatch({ type: "submit/failure", banner: copy });
      }
    } finally {
      // Every exit clears the in-flight flag; the banner (if any) is untouched.
      dispatch({ type: "submit/finish" });
    }
  }

  const busy = cart.status === "loading";
  const hasPlaceholders = cart.items.some((line) => isPendingId(line.id));
  const discount = discountAmount(discountResult, cart.subtotal);
  const estimatedTotal = totalAfterDiscount(cart.subtotal, discount);
  const shortfall = banner?.shortfall ?? null;
  const shortLines =
    shortfall === null ? [] : cart.items.filter((line) => isShortLine(shortfall, line));

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_360px]">
      <form
        className="flex flex-col gap-6"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <CheckoutSteps steps={STEPS} />
        {cart.status === "loading" ? <LoadingState label="Checking your bag…" size="compact" /> : null}
        {cart.status === "error" ? (
          <ErrorState
            title="We could not load your bag. Please try again."
            size="compact"
            action={
              <Button variant="primary" size="sm" onClick={() => void cart.refresh()}>
                Retry
              </Button>
            }
          />
        ) : null}
        {banner ? (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-[var(--radius-md,10px)] border border-[var(--color-error)] bg-[var(--color-error-bg)] px-4 py-3"
          >
            <div className="grid gap-2">
              <p className="m-0 text-sm text-[var(--color-ink)]">{banner.message}</p>
              {shortLines.length > 0 ? (
                <ul className="m-0 grid list-none gap-1 p-0" role="list" aria-label="Unavailable items">
                  {shortLines.map((line) => (
                    <li
                      key={line.id}
                      data-shortfall-item={line.productId}
                      className="rounded-[var(--radius-sm,6px)] bg-[var(--surface-hover)] px-2 py-1 text-xs font-medium text-[var(--color-ink)]"
                    >
                      {line.productName || line.productId}
                      {line.variantId ? ` · ${line.variantId}` : ""}
                    </li>
                  ))}
                </ul>
              ) : null}
              {banner.toCart ? (
                <Button variant="light" size="sm" onClick={() => router.push("/cart")}>
                  Review cart
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}

        <fieldset className="grid gap-4 border-0 p-0 min-w-0" disabled={submitting}>
          <legend className="mb-2 p-0 text-base font-semibold text-[var(--color-ink)]">Shipping address</legend>
          {savedAddresses.length > 0 ? (
            <Select
              label="Use a saved address"
              value={selectedAddress}
              onChange={pickAddress}
              options={[
                { value: "", label: "Use a new address" },
                ...savedAddresses.map((address) => ({
                  value: address.id,
                  label: `${address.label || "Saved address"} — ${address.line1}, ${address.city}`,
                })),
              ]}
            />
          ) : null}
          <Input label="Address line 1" value={shipping.line1} onChange={(value) => fieldsDispatch({ type: "field/set", group: "shipping", name: "line1", value })} required />
          <Input label="Address line 2" value={shipping.line2} onChange={(value) => fieldsDispatch({ type: "field/set", group: "shipping", name: "line2", value })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="City" value={shipping.city} onChange={(value) => fieldsDispatch({ type: "field/set", group: "shipping", name: "city", value })} required />
            <Input label="State / Province" value={shipping.state} onChange={(value) => fieldsDispatch({ type: "field/set", group: "shipping", name: "state", value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Postal code" value={shipping.postalCode} onChange={(value) => fieldsDispatch({ type: "field/set", group: "shipping", name: "postalCode", value })} required />
            <Select label="Country" value={shipping.country} onChange={(value) => fieldsDispatch({ type: "field/set", group: "shipping", name: "country", value })} options={COUNTRY_OPTIONS} required />
          </div>
        </fieldset>

        <div className="grid gap-4">
          <Checkbox
            label="Billing address same as shipping"
            checked={sameBilling}
            onChange={(same) => fieldsDispatch({ type: "same-billing/set", same })}
          />
          {!sameBilling ? (
            <fieldset className="grid gap-4 border-0 p-0 min-w-0" disabled={submitting}>
              <legend className="mb-2 p-0 text-base font-semibold text-[var(--color-ink)]">Billing address</legend>
              <Input label="Address line 1" value={billing.line1} onChange={(value) => fieldsDispatch({ type: "field/set", group: "billing", name: "line1", value })} required />
              <Input label="Address line 2" value={billing.line2} onChange={(value) => fieldsDispatch({ type: "field/set", group: "billing", name: "line2", value })} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="City" value={billing.city} onChange={(value) => fieldsDispatch({ type: "field/set", group: "billing", name: "city", value })} required />
                <Input label="State / Province" value={billing.state} onChange={(value) => fieldsDispatch({ type: "field/set", group: "billing", name: "state", value })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Postal code" value={billing.postalCode} onChange={(value) => fieldsDispatch({ type: "field/set", group: "billing", name: "postalCode", value })} required />
                <Select label="Country" value={billing.country} onChange={(value) => fieldsDispatch({ type: "field/set", group: "billing", name: "country", value })} options={COUNTRY_OPTIONS} required />
              </div>
            </fieldset>
          ) : null}
        </div>

        <fieldset className="grid gap-4 border-0 p-0 min-w-0" disabled={submitting}>
          <legend className="mb-2 p-0 text-base font-semibold text-[var(--color-ink)]">Shipping method</legend>
          <Select
            label="Method"
            value={shippingMethod}
            onChange={(method) => fieldsDispatch({ type: "method/set", method })}
            options={[
              { value: "standard", label: "Standard" },
              { value: "express", label: "Express" },
              { value: "overnight", label: "Overnight" },
            ]}
          />
          <p className="m-0 text-xs text-[var(--text-muted)]">
            The order service calculates the final shipping fee; this choice does not change the total shown here.
          </p>
        </fieldset>

        <fieldset className="grid gap-4 border-0 p-0 min-w-0" disabled={submitting}>
          <legend className="mb-2 p-0 text-base font-semibold text-[var(--color-ink)]">Payment</legend>
          <Select label="Provider" value="mock" onChange={() => {}} options={[{ value: "mock", label: "Mock card (no real charge)" }]} />
          <Input
            label="Discount code (optional)"
            value={discountCode}
            onChange={(v) => {
              // Clearing the field drops the preview in the same event, so the
              // effect never has to dispatch from its body.
              if (v.trim() === "") dispatch({ type: "coupon/clear" });
              else dispatch({ type: "coupon/typed", code: v });
            }}
            placeholder="e.g. SUMMER20"
            error={couponError ?? undefined}
          />
          <Textarea label="Order notes" value={notes} onChange={(value) => fieldsDispatch({ type: "notes/set", notes: value })} placeholder="Delivery instructions, gift message…" rows={3} />
        </fieldset>

        <Button type="submit" fullWidth disabled={submitting || busy || hasPlaceholders || cart.items.length === 0}>
          {submitting ? "Processing…" : `Place order — $${cart.subtotal}`}
        </Button>
      </form>

      <aside className="flex flex-col gap-4 self-start" aria-label="Order summary">
        <h2 className="m-0 text-base font-semibold text-[var(--color-ink)]">{cart.count} {cart.count === 1 ? "item" : "items"}</h2>
        <ul className="m-0 grid list-none gap-3 p-0" role="list">
          {cart.items.map((line) => (
            <CartLineItem
              key={line.id}
              line={line}
              pending={submitting}
              onQty={() => {}}
              onRemove={() => {}}
            />
          ))}
        </ul>
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-[var(--text-muted)]">Subtotal</span>
          <span className="text-sm text-[var(--color-ink)]">${cart.subtotal}</span>
        </div>
        {discountResult && discount > 0 ? (
          <div className="flex items-baseline justify-between text-[var(--color-success)]">
            <span className="text-sm">
              Coupon ({discountResult.code ?? discountCode.trim()})
            </span>
            <span className="text-sm font-medium">-${discount}</span>
          </div>
        ) : null}
        <div className="flex items-baseline justify-between border-t border-[var(--border)] pt-3">
          <span className="text-sm font-semibold text-[var(--color-ink)]">Estimated total</span>
          <span className="text-lg font-semibold text-[var(--color-ink)]">${estimatedTotal}</span>
        </div>
        <p className="m-0 text-xs text-[var(--text-muted)]">
          Shipping and tax are calculated by the order service and shown on the confirmation.
        </p>
      </aside>
    </div>
  );
}

function postCheckout(body: CheckoutInput, key: string) {
  return bff<CheckoutConfirmationDto>("/api/checkout", {
    method: "POST",
    body,
    idempotencyKey: key,
    schema: checkoutConfirmationSchema,
  });
}

