import type { Metadata } from "next";
import PageHeader from "@/components/shell/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import CompareView from "./_components/CompareView";
import { catalogClient } from "@/lib/catalog/client";
import { parseCompareQuery } from "@/lib/commerce/compare";
import { fromCatalogList } from "@/lib/commerce/fromCatalog";
import CompareTray from "./_components/CompareTray";

/** `/compare?ids=a,b` — side-by-side shopping (routing.md §1/§5, A3.7). */
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Compare products",
  alternates: { canonical: "/compare" },
};

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.ids) ? sp.ids[0] : sp.ids;
  const ids = parseCompareQuery(raw ?? null);

  // Prototype parity: this route carries an upward path and a section eyebrow.
  // PageHeader owns both slots; the route only decides their content.
  const header = (
    <PageHeader
      eyebrow="SIDE BY SIDE"
      title="Compare products"
      breadcrumb={[{ label: "Home", href: "/" }, { label: "Compare" }]}
    />
  );

  if (ids.length === 0) {
    return (
      <>
        {header}
        <EmptyState
          title="Nothing to compare yet"
          body="Add products from a listing or product page to see them side by side."
          action={<Button variant="primary" href="/products">Browse products</Button>}
        />
      </>
    );
  }

  const page = await catalogClient().listProducts({ ids, limit: ids.length });

  // I-13: an outage is not "removed products". Keep the two faces distinct.
  const items = page.ok
    ? fromCatalogList(page.data.items).sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id))
    : [];

  return (
    <>
      {header}
      <CompareTray />
      {!page.ok ? (
        // The catalogue could not answer; we do not know if these products exist.
        <EmptyState
          title="We could not load these products"
          body="The catalogue is unavailable right now. Please try again shortly."
          action={<Button variant="primary" href="/compare">Try again</Button>}
        />
      ) : items.length === 0 ? (
        <EmptyState
          title="Those products are no longer available"
          body="They may have been removed or unpublished since you added them."
          action={<Button variant="primary" href="/products">Browse products</Button>}
        />
      ) : (
        <CompareView items={items} />
      )}
    </>
  );
}
