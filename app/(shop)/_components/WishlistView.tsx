"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/shell/PageHeader";
import { Button, EmptyState, Icon } from "@/components/ui";
import ProductGridIsland from "@/components/commerce/ProductGridIsland";
import { useWishlist } from "@/app/_components/WishlistProvider";
import { fromCatalogList } from "@/lib/commerce/fromCatalog";

export default function WishlistView() {
  const router = useRouter();
  const { items, status } = useWishlist();

  const cardItems = useMemo(() => {
    const products = items.map((it) => it.product);
    return fromCatalogList(products);
  }, [items]);

  return (
    <>
      <PageHeader
        title="Wishlist"
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Wishlist" }]}
      />

      {status === "loading" && items.length === 0 ? (
        <p className="py-12 text-center text-sm text-[var(--text-muted)]" role="status">
          Loading your wishlist…
        </p>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Icon name="heart" size={24} />}
          title="Your wishlist is empty"
          body="Save items you like and track them all in one place."
          action={
            <Button variant="light" onClick={() => router.push("/products")}>
              Explore products
            </Button>
          }
        />
      ) : (
        <div className="mt-6">
          <ProductGridIsland items={cardItems} label="Wishlist items" />
        </div>
      )}
    </>
  );
}
