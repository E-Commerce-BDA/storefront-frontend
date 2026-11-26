import type { Metadata } from "next";
import PageHeader from "@/components/shell/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import ProductGridIsland from "@/components/commerce/ProductGridIsland";
import { catalogClient } from "@/lib/catalog/client";
import { fetchThemeSettings } from "@/lib/cms/theme";
import { resolveThemeSettings, toBadgeTones } from "@/lib/cms/themeSettings";
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

  if (ids.length === 0) {
    return (
      <>
        <PageHeader title="Compare products" />
        <EmptyState
          title="Nothing to compare yet"
          body="Add products from a listing or product page to see them side by side."
          action={<Button variant="primary" href="/products">Browse products</Button>}
        />
      </>
    );
  }

  const [page, themeResult] = await Promise.all([
    catalogClient().listProducts({ ids, limit: ids.length }),
    fetchThemeSettings(),
  ]);
  const theme = resolveThemeSettings({ settings: themeResult.theme });
  const cardTheme = theme.productCard;

  // I-13: an outage is not "removed products". Keep the two faces distinct.
  const items = page.ok
    ? fromCatalogList(page.data.items).sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id))
    : [];

  return (
    <>
      <PageHeader title="Compare products" />
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
        <ProductGridIsland
          items={items}
          columns={{
            desktop: cardTheme.colsDesktop,
            tablet: cardTheme.colsTablet,
            phone: cardTheme.colsPhone,
          }}
          themeFallback={cardTheme}
          tones={toBadgeTones(theme)}
        />
      )}
    </>
  );
}
