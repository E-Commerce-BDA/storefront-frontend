import type { Metadata } from "next";
import PageHeader from "@/components/shell/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import { catalogClient } from "@/lib/catalog/client";
import { fetchThemeSettings } from "@/lib/cms/theme";
import { resolveThemeSettings, toBadgeTones } from "@/lib/cms/themeSettings";
import { buildListingQuery, parseListingParams } from "@/lib/catalog/listing";
import { fromCatalogList } from "@/lib/commerce/fromCatalog";
import ProductGridIsland from "@/components/commerce/ProductGridIsland";

/**
 * `/products` — the ONE canonical listing route (routing.md §1; plan §8).
 *
 * Server-rendered catalog (decision 5: SEO, no BFF hop). `?category=` and
 * `?brand=` are filters on this route, never path segments, and a filtered URL
 * canonicalizes to the bare listing (§5.3) — so this is the only products page.
 *
 * The whole flow is: parse the untrusted query (once, in `lib/catalog/listing`),
 * resolve a slug to an id, list, map, render. Data reaches the client island
 * already mapped to card shapes; the page owns no interactivity.
 */

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Products",
  alternates: { canonical: "/products" },
};

/** A filter whose slug could not be resolved: a dead link, not a server error. */
function filterNotFound(kind: "category" | "brand", slug: string) {
  return (
    <>
      <PageHeader title={`${kind[0].toUpperCase()}${kind.slice(1)} not found`} />
      <EmptyState
        title={`No ${kind} “${slug}”.`}
        body={`That link points at a ${kind} that does not exist.`}
        action={
          <Button variant="light" href="/products">
            Browse all products
          </Button>
        }
      />
    </>
  );
}

/** The catalog could not be consulted about a slug at all — say so, keep the URL. */
function filterUnavailable(kind: "category" | "brand", slug: string) {
  return (
    <>
      <PageHeader title="Products" />
      <EmptyState
        title="Products are temporarily unavailable"
        body="The catalog could not be reached. Please try again shortly."
        action={
          <Button
            variant="light"
            href={`/products${buildListingQuery(
              kind === "category" ? { categorySlug: slug } : { brandSlug: slug },
            )}`}
          >
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
  const { categorySlug, brandSlug, query } = parseListingParams(sp);
  const catalog = catalogClient();

  const titles: string[] = [];
  let categoryId: string | undefined;
  let brandId: string | undefined;

  // A slug is a filter, not an identity: an unknown slug is not a 404 — it
  // simply narrows to nothing. Report it as an empty listing so the URL never
  // lies about the page it produced, and keep the filter on a transient failure
  // so a Retry lands back on the page the shopper asked for.
  if (categorySlug !== undefined) {
    const category = await catalog.getCategory(categorySlug);
    if (!category.ok) {
      return category.kind === "not-found"
        ? filterNotFound("category", categorySlug)
        : filterUnavailable("category", categorySlug);
    }
    categoryId = category.data.id;
    titles.push(category.data.name);
  }

  if (brandSlug !== undefined) {
    const brand = await catalog.getBrand(brandSlug);
    if (!brand.ok) {
      return brand.kind === "not-found"
        ? filterNotFound("brand", brandSlug)
        : filterUnavailable("brand", brandSlug);
    }
    brandId = brand.data.id;
    titles.push(brand.data.name);
  }

  const title = titles.length > 0 ? titles.join(" · ") : "All products";

  const page = await catalog.listProducts({
    ...query,
    ...(categoryId ? { categoryId } : {}),
    ...(brandId ? { brandId } : {}),
  });
  if (!page.ok) {
    return (
      <>
        <PageHeader title={title} />
        <EmptyState
          title="Products are temporarily unavailable"
          body="The catalog could not be reached. Please try again shortly."
          action={
            <Button
              variant="light"
              href={`/products${buildListingQuery({ categorySlug, brandSlug, q: query.q, sort: query.sort })}`}
            >
              Retry
            </Button>
          }
        />
      </>
    );
  }

  const items = fromCatalogList(page.data.items);
  const themeResult = await fetchThemeSettings();
  const theme = resolveThemeSettings({ settings: themeResult.theme });
  const cardTheme = theme.productCard;
  const nextHref =
    page.data.nextCursor !== null
      ? `/products${buildListingQuery({
          categorySlug,
          brandSlug,
          q: query.q,
          sort: query.sort,
          cursor: page.data.nextCursor,
        })}`
      : undefined;

  // `?category=`/`?brand=` are the path-like keys, so keep the header bare (a
  // listing gets no breadcrumb — routing.md §2). A next-page link rides in the
  // actions slot; the full filter/sort rail is sf-054.
  return (
    <>
      <PageHeader
        title={title}
        actions={
          nextHref ? (
            <Button variant="light" href={nextHref}>
              Next page
            </Button>
          ) : undefined
        }
      />
      <ProductGridIsland
        items={items}
        columns={{
          desktop: cardTheme.colsDesktop,
          tablet: cardTheme.colsTablet,
          phone: cardTheme.colsPhone,
        }}
        themeFallback={cardTheme}
        tones={toBadgeTones(theme)}
        empty={
          <EmptyState
            title="No products found"
            body={
              query.q
                ? `Nothing matched “${query.q}”.`
                : categoryId || brandId
                  ? "Nothing is listed under this filter yet."
                  : "The catalog has no products yet."
            }
            action={
              <Button variant="light" href="/products">
                Browse all products
              </Button>
            }
          />
        }
      />
    </>
  );
}
