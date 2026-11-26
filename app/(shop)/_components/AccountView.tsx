"use client";

/**
 * AccountView — the `/account` island — sf-051
 * (plan §8: `GET /api/account`; A6.3 list, A6.7 sign-out)
 *
 * One fetch of the fanned-out BFF answer, which already decided its partial
 * degradation (profile fails → whole page fails; history fails → `ordersError`
 * with a profile to render). The island's job is to paint those three states
 * honestly and own the one write available here: sign-out.
 *
 * Sign-out POSTs the BFF (cookies clear server-side), drops the local cart so
 * the badge stops lying to the next person at this keyboard, and lands on
 * `/signin` — the proxy will keep sending a signed-out shopper there anyway.
 * Order *detail*, profile edit and the address book are sf-059; a row that
 * links into an unbuilt page would be the fake this wave promised not to ship.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Badge, Button, DegradedState, EmptyState, ErrorState, Icon, LoadingState } from "@/components/ui";
import PageHeader from "@/components/shell/PageHeader";
import { useCart } from "@/app/_components/CartProvider";
import { useWishlist } from "@/app/_components/WishlistProvider";
import { bff } from "@/lib/http/browser";
import { orderSchema } from "@/lib/order/schemas";
import ProfileForm from "./ProfileForm";
import AddressBook from "./AddressBook";
import PasswordForm from "./PasswordForm";
import type { OrderDto } from "@/lib/order/schemas";

const accountResponseSchema = z
  .object({
    user: z
      .object({
        id: z.string(),
        email: z.string(),
        firstName: z.string().nullish(),
        lastName: z.string().nullish(),
      })
      .loose(),
    orders: z.array(orderSchema),
    ordersError: z
      .object({ code: z.string(), status: z.number() })
      .loose()
      .nullish(),
  })
  .loose();

type AccountView = z.infer<typeof accountResponseSchema>;

export default function AccountView() {
  const router = useRouter();
  const cart = useCart();
  const wishlist = useWishlist();
  const [data, setData] = useState<AccountView | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let alive = true;
    void bff<AccountView>("/api/account", { schema: accountResponseSchema }).then((result) => {
      if (!alive) return;
      if (result.ok) {
        setData(result.data);
        return;
      }
      if (result.kind === "unauthorized") {
        router.push(`/signin?next=${encodeURIComponent("/account")}`);
        return;
      }
      // Any non-401 failure (503 fan-out, contract mismatch) is the same
      // honest answer here: the account could not be read.
      setFailure(result.message || "Account is unavailable right now.");
    });
    return () => {
      alive = false;
    };
  }, [router]);

  if (failure !== null) {
    return (
      <ErrorState
        title="Account unavailable"
        body={failure}
        action={
          <Button variant="primary" onClick={() => router.push("/products")}>
            Continue shopping
          </Button>
        }
      />
    );
  }

  if (data === null) {
    return <LoadingState label="Loading your account…" />;
  }

  const fullName = [data.user.firstName, data.user.lastName].filter(Boolean).join(" ");

  return (
    <>
      <PageHeader
        title={fullName === "" ? data.user.email : fullName}
        actions={
          <Button
            variant="ghost-ink"
            size="sm"
            disabled={signingOut}
            onClick={() => {
              setSigningOut(true);
              void fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" })
                .finally(async () => {
                  await cart.clear();
                  router.push("/signin");
                });
            }}
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </Button>
        }
      />
      <p className="-mt-4 mb-4 text-sm text-[var(--text-muted)]">{data.user.email}</p>
      <div className="mb-8 flex gap-3">
        <Button variant="light" size="sm" onClick={() => router.push("/account/orders")}>
          View all orders
        </Button>
        <Button variant="light" size="sm" onClick={() => router.push("/wishlist")}>
          My wishlist
        </Button>
      </div>

      <section aria-label="Profile" className="mb-8 grid gap-4">
        <h2 className="m-0 text-base font-semibold text-[var(--color-ink)]">Profile</h2>
        <ProfileForm
          email={data.user.email}
          firstName={data.user.firstName}
          lastName={data.user.lastName}
        />
      </section>

      <section aria-label="Address book" className="mb-8 grid gap-4">
        <h2 className="m-0 text-base font-semibold text-[var(--color-ink)]">Address book</h2>
        <AddressBook />
      </section>

      <section aria-label="Password" className="mb-8 grid gap-4">
        <h2 className="m-0 text-base font-semibold text-[var(--color-ink)]">Password</h2>
        <PasswordForm />
      </section>

      <section aria-label="Saved items" className="mb-8 grid gap-3">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="m-0 text-base font-semibold text-[var(--color-ink)]">Wishlist</h2>
          <Button variant="light" size="sm" onClick={() => router.push("/wishlist")}>
            View all
          </Button>
        </div>
        {wishlist.items.length === 0 ? (
          <p className="m-0 text-sm text-[var(--text-muted)]">
            Nothing saved yet. Tap the heart on any product to keep it here.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {wishlist.items.slice(0, 4).map((entry) => (
              <Link
                key={entry.id}
                href={`/products/${encodeURIComponent(entry.product.slug)}`}
                className="flex items-baseline justify-between gap-3 rounded-[var(--radius-md,10px)] border border-[var(--border)] px-4 py-3 text-sm transition-colors hover:border-[var(--color-navy)] hover:bg-[var(--surface-hover)]"
              >
                <span className="truncate text-[var(--color-ink)]">{entry.product.name}</span>
                <span className="font-medium text-[var(--color-ink)]">${entry.product.price}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section aria-label="Order history" className="grid gap-4">
        <h2 className="m-0 text-base font-semibold text-[var(--color-ink)]">Recent orders</h2>

        {data.ordersError ? (
          <DegradedState title="Your orders are unavailable right now — the profile above is still yours." />
        ) : data.orders.length === 0 ? (
          <EmptyState
            icon={<Icon name="shopping-bag" size={22} />}
            title="No orders yet"
            body="When you place an order it will show up here."
            action={
              <Button variant="primary" onClick={() => router.push("/products")}>
                Start shopping
              </Button>
            }
          />
        ) : (
          <ul className="m-0 grid list-none gap-3 p-0" role="list">
            {data.orders.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function OrderRow({ order }: { order: OrderDto }) {
  return (
    <li>
      <Link
        href={`/account/orders/${encodeURIComponent(order.id)}`}
        className="flex items-baseline justify-between gap-4 rounded-[var(--radius-md,10px)] border border-[var(--border)] px-4 py-3 transition-colors hover:border-[var(--color-navy)] hover:bg-[var(--surface-hover)]"
      >
      <div className="grid gap-1">
        <span className="text-sm font-medium text-[var(--color-ink)]">{order.order_number}</span>
        <span className="text-xs text-[var(--text-muted)]">{formatDate(order.created_at)}</span>
      </div>
      <div className="flex items-center gap-3">
        <Badge tone={order.status === "cancelled" ? "error" : order.status === "delivered" ? "success" : "neutral"}>
          {order.status}
        </Badge>
        <span className="text-sm font-semibold text-[var(--color-ink)]">${order.grand_total}</span>
      </div>
      </Link>
    </li>
  );
}

/** ISO row → a readable date; an unparseable stamp shows raw rather than "Invalid Date". */
function formatDate(iso: string): string {
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);
  } catch {
    return iso;
  }
}
