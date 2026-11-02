import type { Metadata } from "next";
import OrdersView from "../../_components/OrdersView";

export const metadata: Metadata = {
  title: "Order History",
  robots: { index: false, follow: false },
};

export default function OrdersPage() {
  return <OrdersView />;
}
