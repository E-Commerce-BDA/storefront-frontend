import type { Metadata } from "next";
import PageHeader from "@/components/shell/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import { catalogClient } from "@/lib/catalog/client";
import { buildListingQuery, parseListingParams } from "@/lib/catalog/listing";
import { fromCatalogList } from "@/lib/commerce/fromCatalog";
import ProductGridIsland from "../_components/ProductGridIsland";

/**
 * `/products` — the ONE canonical listing route (routing.md §1; plan §8).
 *
 * Server-rendered catalog (decision 5: SEO, no BFF hop). `?category=` is a filter
 * on this route, never a path segment, and a filtered URL canonicalizes to the
 * bare listing (§5.3) — so this is the only products page.
 *
 * The whole flow is: parse the untrusted query (once, in `lib/catalog/listing`),
 * resolve a category slug to an id, list, map, render. Data reaches the client
 * island already mapped to card shapes; the page owns no interactivity.
 */

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Products",
  alternates: { canonical: "/products" },
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const { categorySlug, query } = parseListingParams(sp);
  const catalog = catalogClient();

  let title = "All products";
  let categoryId: string | undefined;

  // A `?category=` slug is a filter, not an identity: an unknown slug is not a
  // 404 — it simply narrows to nothing. Report it as an empty listing so the URL
  // never lies about the page it produced.
  if (categorySlug !== undefined) {
    const category = await catalog.getCategory(categorySlug);
    if (!category.ok) {
      const missing = category.kind === "not-found";
      // A dead link drops the filter (browse everything); a transient failure
      // keeps it so a Retry lands back on the page the shopper asked for.
      const retryHref = missing ? "/products" : `/products?category=${encodeURIComponent(categorySlug)}`;
      return (
        <>
          <PageHeader title={missing ? "Category not found" : "Products"} />
          <EmptyState
            title={missing ? `No category “${categorySlug}”.` : "Products are temporarily unavailable"}
            body={
              missing
                ? "That link points at a category that does not exist."
                : "The catalog could not be reached. Please try again shortly."
            }
            action={
              <Button variant="light" href={retryHref}>
                {missing ? "Browse all products" : "Retry"}
              </Button>
            }
          />
        </>
      );
    }
    categoryId = category.data.id;
    title = category.data.name;
  }

  const page = await catalog.listProducts({ ...query, ...(categoryId ? { categoryId } : {}) });
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
              href={`/products${buildListingQuery({ categorySlug, q: query.q, sort: query.sort })}`}
            >
              Retry
            </Button>
          }
        />
      </>
    );
  }

  const items = fromCatalogList(page.data.items);
  const nextHref =
    page.data.nextCursor !== null
      ? `/products${buildListingQuery({
          categorySlug,
          q: query.q,
          sort: query.sort,
          cursor: page.data.nextCursor,
        })}`
      : undefined;

  // `?category=` is the one path-like key, so keep the header bare (a listing gets
  // no breadcrumb — routing.md §2). A next-page link rides in the actions slot;
  // the full filter/sort rail is sf-054.
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
        empty={
          <EmptyState
            title="No products found"
            body={
              query.q
                ? `Nothing matched “${query.q}”.`
                : "This category has no products yet."
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
