import type { Metadata } from "next";
import WishlistView from "../_components/WishlistView";

export const metadata: Metadata = {
  title: "Wishlist",
  description: "View and manage your saved items.",
};

export default function WishlistPage() {
  return <WishlistView />;
}
