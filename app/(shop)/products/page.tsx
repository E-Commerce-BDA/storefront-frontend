import type { Metadata } from "next";
import PageHeader from "@/components/shell/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import Button from "@/components/ui/Button";
import { fetchThemeSettings } from "@/lib/cms/theme";
import { resolveThemeSettings, toBadgeTones } from "@/lib/cms/themeSettings";
import {
  buildListingQuery,
  parseListingParams,
} from "@/lib/catalog/listing";
import { loadListingPage } from "@/lib/catalog/listingPage";
import ListingFilters from "./_components/ListingFilters";
import ListingGridIsland from "./_components/ListingGridIsland";

/**
 * `/products` — the ONE canonical listing route (routing.md §1; sf-054).
 *
 * The first page is server-rendered for SEO; the filter/sort rail and the
 * load-more grid are the two client boundaries. Everything that decides *what*
 * to paint lives in `lib/catalog/listingPage`, which this route and the
 * listing BFF share. `?category=`/`?brand=` are filters, never path segments.
 */
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Products",
  alternates: { canonical: "/products" },
};

function deadFilter(kind: "category" | "brand", slug: string) {
  return (
    <>
      <PageHeader title={`${kind[0].toUpperCase()}${kind.slice(1)} not found`} />
      <EmptyState
        title={`No ${kind} “${slug}”.`}
        body={`That link points at a ${kind} that does not exist.`}
        action={
          <Button variant="primary" href="/products">
            Browse all products
          </Button>
        }
      />
    </>
  );
}

function unavailable(title: string, retry: string) {
  return (
    <>
      <PageHeader title={title} />
      <ErrorState
        title="Products are temporarily unavailable"
        body="The catalog could not be reached. Please try again shortly."
        action={
          <Button variant="primary" href={`/products${retry}`}>
            Retry
          </Button>
        }
      />
    </>
  );
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const loaded = await loadListingPage(sp);

  if (!loaded.ok) {
    if (loaded.kind === "not-found") {
      return deadFilter(loaded.scope as "category" | "brand", loaded.slug ?? "");
    }
    return unavailable("Products", loaded.retry);
  }

  const data = loaded.data;
  const parsed = parseListingParams(sp);
  const themeResult = await fetchThemeSettings();
  const theme = resolveThemeSettings({ settings: themeResult.theme });
  const cardTheme = theme.productCard;

  // The canonical query is the state container: filters + sort, never a
  // cursor. The island appends the cursor when it asks the BFF for page 2.
  const queryKey = buildListingQuery({
    categorySlug: data.categorySlug,
    brandSlug: data.brandSlug,
    q: data.q,
    sort: data.sort,
    tags: data.tags,
    discounted: data.discounted,
    minPrice: parsed.query.minPrice,
    maxPrice: parsed.query.maxPrice,
  });

  const empty = (
    <EmptyState
      title="No products found"
      body={
        data.q
          ? `Nothing matched “${data.q}”.`
          : data.categoryId || data.brandId
            ? "Nothing is listed under this filter yet."
            : "The catalog has no products yet."
      }
      action={
        <Button variant="primary" href="/products">
          Browse all products
        </Button>
      }
    />
  );

  return (
    <>
      <PageHeader
        title={data.title}
        breadcrumb={data.breadcrumb.length > 0 ? data.breadcrumb : undefined}
      />
      <ListingFilters
        categories={data.facets.categories}
        brands={data.facets.brands}
        tags={data.facets.tags}
        priceBounds={{
          min: data.facets.minPrice,
          max: data.facets.maxPrice,
        }}
        selected={{
          categorySlug: data.categorySlug,
          brandSlug: data.brandSlug,
          tags: data.tags,
          discounted: data.discounted,
          minPrice: parsed.query.minPrice,
          maxPrice: parsed.query.maxPrice,
          q: data.q,
          sort: data.sort,
        }}
      />
      <ListingGridIsland
        initialItems={data.items}
        initialCursor={data.nextCursor}
        queryKey={queryKey}
        columns={{
          desktop: cardTheme.colsDesktop,
          tablet: cardTheme.colsTablet,
          phone: cardTheme.colsPhone,
        }}
        themeFallback={cardTheme}
        tones={toBadgeTones(theme)}
        empty={empty}
      />
    </>
  );
}
