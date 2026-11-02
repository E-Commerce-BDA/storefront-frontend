import type { Metadata } from "next";
import PageHeader from "@/components/shell/PageHeader";
import OrderConfirmation from "../../../_components/OrderConfirmation";

export const metadata: Metadata = {
  title: "Order Details",
  robots: { index: false, follow: false },
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <>
      <PageHeader
        title="Order Details"
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Account", href: "/account" },
          { label: "Orders", href: "/account/orders" },
          { label: id },
        ]}
      />
      <div className="mt-6">
        <OrderConfirmation
          orderId={id}
          signinNextPath={`/account/orders/${id}`}
        />
      </div>
    </>
  );
}
