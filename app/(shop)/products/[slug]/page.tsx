import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageHeader from "@/components/shell/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import SectionRenderer from "@/components/sections/SectionRenderer";
import { catalogClient } from "@/lib/catalog/client";
import { cmsBaseUrl, createCmsClient } from "@/lib/cms/client";
import { fetchThemeSettings } from "@/lib/cms/theme";
import { resolveThemeSettings, toBadgeTones } from "@/lib/cms/themeSettings";
import { GALLERY_MAX_IMAGES, toGalleryImages } from "@/lib/commerce/gallery";
import { buildProductJsonLd } from "@/lib/commerce/jsonLd";
import { resolvePhotoSettings } from "@/lib/commerce/photoSettings";
import { buildPdpFallbackSections, pdpPageKey, summarizePdpReviews } from "@/lib/sections/pdp";
import { resolveSections } from "@/lib/sections/resolveSections";
import type { BreadcrumbItem } from "@/lib/shell/pageHeader";
import type { SectionViewModel } from "@/lib/sections/viewModels";
import PurchasePanel from "../../_components/PurchasePanel";
import RecentlyViewed from "../../_components/RecentlyViewed";

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

  // Per-product CMS sections, keyed by product id (never slug). The
  // `pdp-default` blueprint is materialized into this page by the admin
  // clone endpoint; it is never read here.
  const pageKey = pdpPageKey(product.id);
  const [cmsRead, themeResult] = await Promise.all([
    pageKey
      ? createCmsClient({ baseUrl: cmsBaseUrl() }).getSections(pageKey)
      : Promise.resolve(null),
    fetchThemeSettings(),
  ]);
  const cmsSectionsResponse = cmsRead?.data ?? null;

  let resolvedSections: SectionViewModel[];
  if (!pageKey) {
    // A product id that cannot form a valid page key has no sections; this
    // is not an outage, so the fallback must not be built.
    console.warn(`[pdp] product "${product.id}" cannot form a pdp page key`);
    resolvedSections = [];
  } else if (cmsSectionsResponse === null) {
    // CMS outage only. An empty successful response renders no sections.
    console.warn(`[pdp] cms unavailable for "${pageKey}"; using fallback sections`);
    resolvedSections = await resolveSections(
      buildPdpFallbackSections(product),
      undefined,
      { product },
    );
  } else {
    resolvedSections = await resolveSections(cmsSectionsResponse.sections, undefined, {
      product,
    });
    if (resolvedSections.length === 0) {
      console.warn(`[pdp] no sections rendered for "${pageKey}" (${cmsSectionsResponse.sections.length} in cms)`);
    }
  }

  const reviewSummary = summarizePdpReviews(resolvedSections);
  const theme = resolveThemeSettings({ settings: themeResult.theme });
  const cardTheme = theme.productCard;
  // Product > section > global. The product bag comes from catalog; the CMS
  // section layer is currently absent (no photo knobs on PDP section settings
  // yet), so the two real layers are product and the resolved theme global.
  const photoSettings = resolvePhotoSettings(
    [(product.photoSettings ?? {}) as Record<string, unknown>],
    theme.photoSettings,
  );

  const jsonLd = buildProductJsonLd(product);

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
        rating={reviewSummary.rating}
        ratingCount={reviewSummary.count}
        photoSettings={photoSettings}
      />

      {resolvedSections.length > 0 ? (
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
      ) : null}

      <RecentlyViewed excludeSlug={product.slug} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
