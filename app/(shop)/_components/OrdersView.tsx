"use client";

import { useEffect, useReducer } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/shell/PageHeader";
import OrderRow from "@/components/commerce/OrderRow";
import { Button, EmptyState, ErrorState, Icon, LoadingState } from "@/components/ui";
import { bff } from "@/lib/http/browser";
import { orderListResponseSchema, type OrderDto } from "@/lib/order/schemas";
import { initialOrdersMachine, ordersMachine } from "@/lib/orders/machine";
type OrderListResponse = { data: OrderDto[]; nextCursor?: string | null };

export default function OrdersView() {
  const router = useRouter();
  const [machine, dispatch] = useReducer(ordersMachine, undefined, initialOrdersMachine);
  const { orders, cursor: nextCursor, status, loadingMore, moreError } = machine;

  useEffect(() => {
    dispatch({ type: "mount" });
    let alive = true;
    void bff<OrderListResponse>("/api/orders", { schema: orderListResponseSchema }).then((res) => {
      if (!alive) return;
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/signin?next=/account/orders");
          return;
        }
        dispatch({ type: "list/error", message: "Unable to load orders right now." });
        return;
      }
      dispatch({
        type: "list/success",
        orders: res.data.data,
        cursor: res.data.nextCursor ?? null,
      });
    });
    return () => {
      alive = false;
      dispatch({ type: "unmount" });
    };
  }, [router]);

  async function loadMore() {
    if (nextCursor === null || loadingMore) return;
    dispatch({ type: "more/start" });
    const res = await bff<OrderListResponse>(`/api/orders?cursor=${encodeURIComponent(nextCursor)}`, {
      schema: orderListResponseSchema,
    });
    if (!res.ok) {
      // A12: a failed load-more is visible, never silently swallowed.
      dispatch({ type: "more/error", message: "Could not load more orders. Please try again." });
      return;
    }
    dispatch({
      type: "more/success",
      orders: res.data.data,
      cursor: res.data.nextCursor ?? null,
    });
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

      {status === "loading" || status === "idle" ? (
        <LoadingState label="Loading your orders…" />
      ) : status === "error" ? (
        <ErrorState title="Unable to load orders right now." />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<Icon name="shopping-bag" size={24} />}
          title="No orders found"
          body="You haven't placed any orders yet."
          action={
            <Button variant="primary" onClick={() => router.push("/products")}>
              Start shopping
            </Button>
          }
        />
      ) : (
        <div className="mt-6 grid gap-4">
          <ul className="m-0 grid list-none gap-3 p-0" role="list">
            {orders.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </ul>

          {moreError ? <ErrorState title={moreError} size="compact" /> : null}

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

