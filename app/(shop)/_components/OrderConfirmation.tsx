"use client";

/**
 * OrderConfirmation — the confirmation island — sf-051
 * (plan §8: `GET /api/orders/[id]`; A5.8)
 *
 * Re-reads the order over HTTP instead of remembering the POST body: a page
 * you can refresh is a page you can trust, and G4 checks exactly that. The id
 * arrived in the URL, which is also why the confirmation is a *route* and not
 * a form state.
 *
 * A 404 is not rendered as an error stack: order-svc answers the same 404 for
 * "no such order" and "not yours", so the honest copy is "we can't find this
 * order on your account" — guessing which is not the storefront's job. A 401
 * survives `bff`'s one refresh-and-replay and still means the session is gone;
 * that shopper goes to sign-in with `next` pointed back here.
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, EmptyState, Icon } from "@/components/ui";
import { bff } from "@/lib/http/browser";
import { orderSchema, type OrderDto } from "@/lib/order/schemas";
import type { ServiceResult } from "@/lib/http/result";

export interface OrderConfirmationProps {
  orderId: string;
  signinNextPath?: string;
}

export default function OrderConfirmation({
  orderId,
  signinNextPath,
}: OrderConfirmationProps) {
  const router = useRouter();
  const [result, setResult] = useState<ServiceResult<OrderDto> | null>(null);

  useEffect(() => {
    let alive = true;
    void bff<OrderDto>(`/api/orders/${encodeURIComponent(orderId)}`, {
      schema: orderSchema,
    }).then((next) => {
      if (alive) setResult(next);
    });
    return () => {
      alive = false;
    };
  }, [orderId]);

  if (result === null) {
    return (
      <p className="text-sm text-[var(--text-muted)]" role="status">
        Loading your order…
      </p>
    );
  }

  if (!result.ok) {
    if (result.kind === "unauthorized") {
      router.push(
        `/signin?next=${encodeURIComponent(
          signinNextPath ?? `/checkout/confirmation/${orderId}`,
        )}`,
      );
      return null;
    }
    return (
      <EmptyState
        icon={<Icon name="shopping-bag" size={22} />}
        title={result.kind === "not-found" ? "We can't find this order on your account" : "Order details unavailable"}
        body={
          result.kind === "not-found"
            ? "The link may be from a different account, or the order number was mistyped."
            : "Your order may still have been placed — check your account history."
        }
        action={
          <Button variant="light" onClick={() => router.push("/account")}>
            View order history
          </Button>
        }
      />
    );
  }

  const order = result.data;
  return (
    <div className="grid max-w-2xl gap-8">
      <div className="flex items-center gap-3">
        <h2 className="m-0 text-xl font-semibold text-[var(--color-ink)]">
          Order {order.order_number}
        </h2>
        <Badge tone={order.status === "cancelled" ? "error" : "success"}>{order.status}</Badge>
      </div>

      <ul className="m-0 grid list-none gap-3 p-0" role="list">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-baseline justify-between gap-4">
            <span className="text-sm text-[var(--color-ink)]">
              {item.qty} × {item.product_name}
              <span className="ml-2 text-xs text-[var(--text-muted)]">{item.sku}</span>
            </span>
            <span className="text-sm font-medium text-[var(--color-ink)]">${item.line_total}</span>
          </li>
        ))}
      </ul>

      <dl className="m-0 grid gap-2 border-t border-[var(--border)] pt-3">
        <SummaryRow term="Subtotal" value={order.subtotal} />
        <SummaryRow term="Shipping" value={order.shipping_fee} />
        <SummaryRow term="Tax" value={order.tax} />
        {order.discount > 0 ? <SummaryRow term="Discount" value={-order.discount} /> : null}
        <div className="mt-1 flex items-baseline justify-between">
          <dt className="text-sm font-semibold text-[var(--color-ink)]">Total</dt>
          <dd className="m-0 text-lg font-semibold text-[var(--color-ink)]">${order.grand_total}</dd>
        </div>
      </dl>

      <div className="rounded-[var(--radius-md,10px)] border border-[var(--border)] p-4 text-sm text-[var(--text-muted)]">
        <p className="m-0 font-semibold text-[var(--color-ink)]">Shipping to</p>
        <address className="mt-1 not-italic">
          {order.shipping_address.line1}
          {order.shipping_address.line2 ? `, ${order.shipping_address.line2}` : ""}
          <br />
          {order.shipping_address.city}
          {order.shipping_address.state ? `, ${order.shipping_address.state}` : ""} {order.shipping_address.postalCode}
          <br />
          {order.shipping_address.country}
        </address>
      </div>

      <div className="flex gap-3">
        <Button variant="light" onClick={() => router.push("/account")}>
          Order history
        </Button>
        <Button variant="ghost-ink" onClick={() => router.push("/products")}>
          Continue shopping
        </Button>
      </div>
    </div>
  );
}

function SummaryRow({ term, value }: { term: string; value: number }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-sm text-[var(--text-muted)]">{term}</dt>
      <dd className="m-0 text-sm text-[var(--color-ink)]">${value}</dd>
    </div>
  );
}
