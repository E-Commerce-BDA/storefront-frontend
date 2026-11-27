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
import { useEffect, useMemo, useReducer, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Button, DegradedState, EmptyState, ErrorState, Icon, LoadingState } from "@/components/ui";
import OrderRow from "@/components/commerce/OrderRow";
import AccountTabs from "@/components/commerce/AccountTabs";
import {
  accountTabEvent,
  accountTabHref,
  accountTabsMachine,
  initialAccountTabsMachine,
  type AccountTab,
} from "@/lib/account/machine";
import PageHeader from "@/components/shell/PageHeader";
import { useCart } from "@/app/_components/CartProvider";
import { useWishlist } from "@/app/_components/WishlistProvider";
import { bff } from "@/lib/http/browser";
import { fromCatalogList } from "@/lib/commerce/fromCatalog";
import { orderSchema } from "@/lib/order/schemas";
import ProfileForm from "./ProfileForm";
import AddressBook from "./AddressBook";
import PasswordForm from "./PasswordForm";

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

export interface AccountViewProps {
  /** Deep link from `?tab=`; the URL stays the source of truth. */
  tab?: AccountTab;
}

export default function AccountView({ tab = "overview" }: AccountViewProps) {
  const router = useRouter();
  const cart = useCart();
  const wishlist = useWishlist();
  // The machine translates a tab press into a face and the island pushes the
  // canonical URL; a refresh rehydrates the same face from the prop.
  const [{ tab: active }, dispatch] = useReducer(
    accountTabsMachine,
    tab,
    initialAccountTabsMachine,
  );
  // One mapper: the mini-list quotes effectivePrice, not the raw list price.
  const wishlistCards = useMemo(
    () => fromCatalogList(wishlist.items.map((entry) => entry.product)),
    [wishlist.items],
  );
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
      <AccountTabs
        active={active}
        onSelect={(next) => {
          dispatch(accountTabEvent(next));
          router.push(accountTabHref(next));
        }}
        className="mb-6"
      />

      <section aria-label="Profile" className="mb-8 grid gap-4" hidden={active !== "overview" && active !== "profile"}>
        <h2 className="m-0 text-base font-semibold text-[var(--color-ink)]">Profile</h2>
        <ProfileForm
          email={data.user.email}
          firstName={data.user.firstName}
          lastName={data.user.lastName}
        />
      </section>

      <section aria-label="Address book" className="mb-8 grid gap-4" hidden={active !== "overview" && active !== "addresses"}>
        <h2 className="m-0 text-base font-semibold text-[var(--color-ink)]">Address book</h2>
        <AddressBook />
      </section>

      <section aria-label="Password" className="mb-8 grid gap-4" hidden={active !== "overview" && active !== "profile"}>
        <h2 className="m-0 text-base font-semibold text-[var(--color-ink)]">Password</h2>
        <PasswordForm />
      </section>

      <section aria-label="Saved items" className="mb-8 grid gap-3" hidden={active !== "overview" && active !== "wishlist"}>
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
            {wishlistCards.slice(0, 4).map((card) => (
              <Link
                key={card.id}
                href={card.url ?? `/products/${encodeURIComponent(card.name)}`}
                className="flex items-baseline justify-between gap-3 rounded-[var(--radius-md,10px)] border border-[var(--border)] px-4 py-3 text-sm transition-colors hover:border-[var(--color-navy)] hover:bg-[var(--surface-hover)]"
              >
                <span className="truncate text-[var(--color-ink)]">{card.name}</span>
                <span className="font-medium text-[var(--color-ink)]">${card.price}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section aria-label="Order history" className="grid gap-4" hidden={active !== "overview" && active !== "orders" && active !== "orderDetail"}>
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
              <OrderRow key={order.id} order={order} compact />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

