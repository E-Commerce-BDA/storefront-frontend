import type { Metadata } from "next";
import PageHeader from "@/components/shell/PageHeader";
import OrderConfirmation from "@/app/(shop)/_components/OrderConfirmation";

/**
 * `/checkout/confirmation/[orderId]` — static shell (plan §8; A5.8).
 *
 * The id in the URL *is* the data contract: the island re-reads the order
 * through `GET /api/orders/[id]`, so this page survives refresh, back-button
 * and a paste from an email — none of which a remembered POST response could.
 */

export const metadata: Metadata = {
  title: "Order confirmation",
  robots: { index: false, follow: false },
};

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  return (
    <>
      <PageHeader eyebrow="Thank you" title="Order confirmation" />
      <OrderConfirmation orderId={orderId} />
    </>
  );
}
