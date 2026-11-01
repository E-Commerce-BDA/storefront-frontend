import type { Metadata } from "next";
import PageHeader from "@/components/shell/PageHeader";
import CheckoutForm from "../_components/CheckoutForm";

/**
 * `/checkout` — a static shell over the client store (plan §8; decision 4).
 * Private, per-session data like `/cart`: the proxy already redirects a
 * signed-out shopper to `/signin?next=/checkout`, so whatever renders here has
 * a session and a live `CartProvider` — the page itself ships chrome only.
 */

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <>
      <PageHeader title="Checkout" />
      <CheckoutForm />
    </>
  );
}
