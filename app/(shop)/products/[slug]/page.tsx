import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageHeader from "@/components/shell/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import SectionRenderer from "@/components/sections/SectionRenderer";
import { catalogClient } from "@/lib/catalog/client";
import { cmsBaseUrl, createCmsClient } from "@/lib/cms/client";
import { fetchThemeSettings } from "@/lib/cms/theme";
import { resolveThemeSettings, toBadgeTones } from "@/lib/cms/themeSettings";
import { fromCatalogList } from "@/lib/commerce/fromCatalog";
import { GALLERY_MAX_IMAGES, toGalleryImages } from "@/lib/commerce/gallery";
import { buildProductJsonLd } from "@/lib/commerce/jsonLd";
import { resolveSections } from "@/lib/sections/resolveSections";
import type { BreadcrumbItem } from "@/lib/shell/pageHeader";
import PurchasePanel from "../../_components/PurchasePanel";
import RecentlyViewed from "../../_components/RecentlyViewed";
import ProductGridIsland from "@/components/commerce/ProductGridIsland";

/**
 * `/products/[slug]` — the PDP (plan §8: static ISR 60; A3.*).
 *
 * Rendered from catalog-svc in the RSC (decision 5: SEO, one canonical bare
 * slug), then handed to one client island (`PurchasePanel`) for the interactive
 * buy box. The rest of the page — description, attributes, CMS sections,
 * recently viewed, related — is static markup, so a shopper with JS off still reads the product.
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
  if (!result.ok || result.data.status !== "active") {
    return { title: "Product not found" };
  }

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

  // Inactive or draft products must return 404
  if (product.status !== "active") {
    notFound();
  }

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

  // Concurrently fetch CMS sections for this PDP and related category items
  const [cmsSectionsResponse, related] = await Promise.all([
    createCmsClient({ baseUrl: cmsBaseUrl() }).getSections(`pdp-${product.slug}`),
    product.category
      ? catalogClient().listProducts({ categoryId: product.category.id, limit: 12 })
      : Promise.resolve(null),
  ]);

  const resolvedSections = cmsSectionsResponse?.sections
    ? await resolveSections(cmsSectionsResponse.sections)
    : [];

  // Compute rating and ratingCount from active testimonial items
  const testimonialItems = resolvedSections
    .filter((s): s is Extract<typeof s, { type: "testimonial" }> => s.type === "testimonial")
    .flatMap((s) => s.items);

  const ratings = testimonialItems
    .map((i) => i.rating)
    .filter((r): r is number => typeof r === "number" && r > 0);

  const rating =
    ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : null;
  const ratingCount = ratings.length > 0 ? ratings.length : null;

  const relatedItems =
    related && related.ok
      ? fromCatalogList(related.data.items.filter((row: { id: string; status: string }) => row.id !== product.id && row.status === "active")).slice(0, 8)
      : [];
  const themeResult = await fetchThemeSettings();
  const theme = resolveThemeSettings({ settings: themeResult.theme });
  const cardTheme = theme.productCard;

  const jsonLd = buildProductJsonLd(product);

  const attributes = Object.entries(product.attributes ?? {}).filter(
    ([, value]) =>
      typeof value === "string" || typeof value === "number" || typeof value === "boolean",
  );

  return (
    <>
      <PageHeader breadcrumb={breadcrumb} />

      <PurchasePanel
        productId={product.id}
        name={product.name}
        images={toGalleryImages(product.images, product.name).slice(0, GALLERY_MAX_IMAGES)}
        options={product.options}
        variants={product.variants}
        price={displayed}
        compareAt={product.compareAtPrice}
        stock={product.stock}
        rating={rating}
        ratingCount={ratingCount}
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

      {resolvedSections.length > 0 ? (
        <div id="reviews" className="mt-12">
          <SectionRenderer
            models={resolvedSections}
            columns={{
              desktop: cardTheme.colsDesktop,
              tablet: cardTheme.colsTablet,
              phone: cardTheme.colsPhone,
            }}
            themeFallback={cardTheme}
            tones={toBadgeTones(theme)}
          />
        </div>
      ) : null}

      <RecentlyViewed excludeSlug={product.slug} />

      {relatedItems.length > 0 ? (
        <section className="mt-12">
          <h2 className="mb-4 font-display text-lg text-[var(--color-ink)]">You may also like</h2>
          <ProductGridIsland
            items={relatedItems}
            label="Related products"
            columns={{
              desktop: cardTheme.colsDesktop,
              tablet: cardTheme.colsTablet,
              phone: cardTheme.colsPhone,
            }}
            themeFallback={cardTheme}
            tones={toBadgeTones(theme)}
          />
        </section>
      ) : null}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
