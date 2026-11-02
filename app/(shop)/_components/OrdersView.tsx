"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/shell/PageHeader";
import { Badge, Button, EmptyState, Icon } from "@/components/ui";
import { bff } from "@/lib/http/browser";
import { orderListResponseSchema, type OrderDto } from "@/lib/order/schemas";
type OrderListResponse = { data: OrderDto[]; nextCursor?: string | null };

export default function OrdersView() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void bff<OrderListResponse>("/api/orders", { schema: orderListResponseSchema }).then((res) => {
      if (!alive) return;
      setLoading(false);
      if (res.ok) {
        setOrders(res.data.data);
        setNextCursor(res.data.nextCursor ?? null);
      } else {
        if (res.status === 401) {
          router.push("/signin?next=/account/orders");
          return;
        }
        setError("Unable to load orders right now.");
      }
    });
    return () => {
      alive = false;
    };
  }, [router]);

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    const res = await bff<OrderListResponse>(`/api/orders?cursor=${encodeURIComponent(nextCursor)}`, {
      schema: orderListResponseSchema,
    });
    setLoadingMore(false);
    if (res.ok) {
      setOrders((prev) => [...prev, ...res.data.data]);
      setNextCursor(res.data.nextCursor ?? null);
    }
  }

  return (
    <>
      <PageHeader
        title="Order History"
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Account", href: "/account" },
          { label: "Orders" },
        ]}
      />

      {loading ? (
        <p className="py-12 text-center text-sm text-[var(--text-muted)]" role="status">
          Loading your orders…
        </p>
      ) : error ? (
        <p className="rounded-[var(--radius-md,10px)] border border-[var(--border)] p-4 text-sm text-[var(--text-muted)]">
          {error}
        </p>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<Icon name="shopping-bag" size={24} />}
          title="No orders found"
          body="You haven't placed any orders yet."
          action={
            <Button variant="light" onClick={() => router.push("/products")}>
              Start shopping
            </Button>
          }
        />
      ) : (
        <div className="mt-6 grid gap-4">
          <ul className="m-0 grid list-none gap-3 p-0" role="list">
            {orders.map((order) => (
              <li
                key={order.id}
                className="group relative rounded-[var(--radius-md,10px)] border border-[var(--border)] p-4 transition-colors hover:border-[var(--color-navy)] hover:bg-[var(--surface-hover)]"
              >
                <Link
                  href={`/account/orders/${encodeURIComponent(order.id)}`}
                  className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="grid gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[var(--color-ink)]">
                        {order.order_number}
                      </span>
                      <Badge
                        tone={
                          order.status === "cancelled"
                            ? "error"
                            : order.status === "delivered"
                              ? "success"
                              : "neutral"
                        }
                      >
                        {order.status}
                      </Badge>
                    </div>
                    <span className="text-xs text-[var(--text-muted)]">
                      Placed on {formatDate(order.created_at)} · {order.items.length}{" "}
                      {order.items.length === 1 ? "item" : "items"}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-base font-semibold text-[var(--color-ink)]">
                      ${order.grand_total}
                    </span>
                    <span className="text-xs font-medium text-[var(--color-navy)] group-hover:underline">
                      View details →
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {nextCursor ? (
            <div className="mt-4 flex justify-center">
              <Button variant="light" disabled={loadingMore} onClick={() => void loadMore()}>
                {loadingMore ? "Loading more…" : "Load more orders"}
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(d);
  } catch {
    return iso;
  }
}
