import type { Metadata } from "next";
import PageHeader from "@/components/shell/PageHeader";
import CartView from "../_components/CartView";

/**
 * `/cart` — a static shell over the client store (plan §8; decision 4).
 *
 * The cart is private, per-session data that `CartProvider` already holds for the
 * badge and the drawer; rendering it on the server would either cache one
 * shopper's basket or force the whole app dynamic. So the route ships chrome only
 * and the island paints the lines from the store — the same reducer the drawer
 * reads, so a quantity changed here is already correct there.
 */

export const metadata: Metadata = {
  title: "Cart",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <>
      <PageHeader title="Cart" />
      <CartView />
    </>
  );
}
