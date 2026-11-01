import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageHeader from "@/components/shell/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { catalogClient } from "@/lib/catalog/client";
import { fromCatalogList } from "@/lib/commerce/fromCatalog";
import { toGalleryImages } from "@/lib/commerce/gallery";
import { buildProductJsonLd } from "@/lib/commerce/jsonLd";
import type { BreadcrumbItem } from "@/lib/shell/pageHeader";
import PurchasePanel from "../../_components/PurchasePanel";
import ProductGridIsland from "../../_components/ProductGridIsland";

/**
 * `/products/[slug]` — the PDP (plan §8: static ISR 60; A3.*).
 *
 * Rendered from catalog-svc in the RSC (decision 5: SEO, one canonical bare
 * slug), then handed to one client island (`PurchasePanel`) for the interactive
 * buy box. The rest of the page — description, attributes, related — is static
 * markup, so a shopper with JS off still reads the product.
 *
 * `getProduct` is called by both `generateMetadata` and the page; Next dedupes
 * the identical fetch (same URL, same `revalidate`) so the catalog is hit once.
 */

export const revalidate = 60;

async function loadProduct(slug: string) {
  return catalogClient().getProduct(slug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await loadProduct(slug);
  if (!result.ok) return { title: "Product not found" };

  const product = result.data;
  return {
    title: product.name,
    description: product.shortDescription ?? undefined,
    alternates: { canonical: `/products/${encodeURIComponent(slug)}` },
    openGraph: {
      title: product.name,
      ...(product.shortDescription ? { description: product.shortDescription } : {}),
      ...(product.images[0]?.url ? { images: [product.images[0].url] } : {}),
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await loadProduct(slug);

  if (!result.ok) {
    // A genuine 404 is a different fact from "the catalog is down"; only the
    // first belongs on the not-found page. A transient failure says so plainly.
    if (result.kind === "not-found") notFound();
    return (
      <>
        <PageHeader title="Product" />
        <EmptyState
          title="This product is temporarily unavailable"
          body="We could not reach the catalog. Please try again shortly."
        />
      </>
    );
  }

  const product = result.data;
  const displayed = product.effectivePrice ?? product.price;

  const breadcrumb: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    ...(product.category
      ? [
          {
            label: product.category.name,
            href: `/products?category=${encodeURIComponent(product.category.slug)}`,
          },
        ]
      : []),
    { label: product.name },
  ];

  // Related ships from the same category, minus the product on screen. A failure
  // here is not worth blanking the PDP, so the rail simply omits itself.
  const related = product.category
    ? await catalogClient().listProducts({ categoryId: product.category.id, limit: 12 })
    : null;
  const relatedItems =
    related && related.ok
      ? fromCatalogList(related.data.items.filter((row) => row.id !== product.id)).slice(0, 8)
      : [];

  const jsonLd = buildProductJsonLd(product);

  const attributes = Object.entries(product.attributes ?? {}).filter(
    ([, value]) => typeof value === "string" || typeof value === "number" || typeof value === "boolean",
  );

  return (
    <>
      <PageHeader title={product.name} breadcrumb={breadcrumb} />

      <PurchasePanel
        productId={product.id}
        name={product.name}
        images={toGalleryImages(product.images, product.name)}
        options={product.options}
        variants={product.variants}
        price={displayed}
        compareAt={product.compareAtPrice}
        stock={product.stock}
      />

      {product.description ? (
        <section className="mt-10">
          <h2 className="mb-2 font-display text-lg text-[var(--color-ink)]">Description</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--text-muted)]">
            {product.description}
          </p>
        </section>
      ) : null}

      {attributes.length > 0 ? (
        <section className="mt-8">
          <h2 className="mb-2 font-display text-lg text-[var(--color-ink)]">Details</h2>
          <dl className="grid grid-cols-1 gap-x-8 gap-y-1 text-sm sm:grid-cols-2">
            {attributes.map(([key, value]) => (
              <div key={key} className="flex justify-between gap-4 border-b border-[var(--border)] py-1">
                <dt className="text-[var(--text-muted)]">{key}</dt>
                <dd className="text-[var(--color-ink)]">{String(value)}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {relatedItems.length > 0 ? (
        <section className="mt-12">
          <h2 className="mb-4 font-display text-lg text-[var(--color-ink)]">You may also like</h2>
          <ProductGridIsland items={relatedItems} label="Related products" />
        </section>
      ) : null}

      <script
        type="application/ld+json"
        // JSON-LD is inert text, not markup; Next requires the raw insertion here.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
