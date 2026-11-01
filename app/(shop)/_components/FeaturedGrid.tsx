import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { catalogClient } from "@/lib/catalog/client";
import { fromCatalogList } from "@/lib/commerce/fromCatalog";
import ProductGridIsland from "./ProductGridIsland";

/**
 * FeaturedGrid — the home strip of live products — sf-051
 * (plan §8: "8 featured products"; A1 teaser)
 *
 * Server-fetched like the listing (decision 5) and handed to the same
 * `ProductGridIsland` the listing uses — quick-add and all. Two honest
 * compromises live here:
 *
 * - **The catalog has no `featured` flag**, so v1 shows the 8 newest active
 *   products under the heading "New arrivals" — the heading names the rule the
 *   data actually follows. A curated strip is cms-svc's job (sf-060).
 * - **The strip degrades silently-but-loudly**: a catalog outage does not
 *   blank the home page (the hero still renders); this section swaps to a
 *   one-line unavailable state with a retry, and nothing is faked in its place.
 */

export const FEATURED_LIMIT = 8;

export default async function FeaturedGrid() {
  const page = await catalogClient().listProducts({
    limit: FEATURED_LIMIT,
    sort: "created_desc",
  });

  if (!page.ok) {
    return (
      <section aria-label="New arrivals" className="grid gap-4">
        <h2 className="m-0 text-lg font-semibold text-[var(--color-ink)]">New arrivals</h2>
        <EmptyState
          title="Products are temporarily unavailable"
          body="The catalog could not be reached. The rest of the page is fine — try again shortly."
          action={
            <Button variant="light" href="/">
              Retry
            </Button>
          }
        />
      </section>
    );
  }

  const items = fromCatalogList(page.data.items);
  if (items.length === 0) return null; // A brand-new empty catalog needs no theatre.

  return (
    <section aria-label="New arrivals" className="grid gap-4">
      <div className="flex items-baseline justify-between">
        <h2 className="m-0 text-lg font-semibold text-[var(--color-ink)]">New arrivals</h2>
        <Button variant="ghost-ink" size="sm" href="/products">
          View all products
        </Button>
      </div>
      <ProductGridIsland items={items} label="New arrivals" />
    </section>
  );
}
