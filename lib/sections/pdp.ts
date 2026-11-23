
import type { Section } from "@ecom/contracts";
import type { ProductDetailDto } from "@/lib/catalog/schemas";
import { PRODUCT_TRUST_ITEMS } from "@/lib/commerce/productTrust";
import { isPageKey } from "@/lib/cms/tags";
import type { PdpDetailRow, SectionViewModel } from "./viewModels";

/**
 * The one PDP page key for a product. Lowercased because catalog ids are
 * UUIDs while CMS page keys are lowercase kebab-case. Returns null for a
 * product id that cannot form a valid key — the caller treats that as
 * "no sections", never as a CMS outage.
 */
export function pdpPageKey(productId: string): string | null {
  const key = `pdp-${productId.toLowerCase()}`;
  return isPageKey(key) ? key : null;
}

export interface PdpReviewSummary {
  rating: number | null;
  count: number | null;
}

/**
 * Derive the buy-box rating from resolved `pdp_reviews` view models (all
 * active reviews sections, not just the first). Unrated quotes render but
 * never enter the average; no rating is ever invented.
 */
export function summarizePdpReviews(
  models: readonly SectionViewModel[],
): PdpReviewSummary {
  const ratings = models
    .filter((model) => model.type === "pdp_reviews")
    .flatMap((model) => model.items)
    .map((item) => item.rating)
    .filter(
      (rating): rating is number =>
        typeof rating === "number" && rating >= 1 && rating <= 5,
    );
  if (ratings.length === 0) return { rating: null, count: null };
  const sum = ratings.reduce((total, rating) => total + rating, 0);
  return { rating: sum / ratings.length, count: ratings.length };
}

export function catalogDetailRows(
  product: ProductDetailDto,
): PdpDetailRow[] {
  return Object.entries(product.attributes ?? {})
    .filter(
      (entry): entry is [string, string | number | boolean] =>
        typeof entry[1] === "string" ||
        typeof entry[1] === "number" ||
        typeof entry[1] === "boolean",
    )
    .map(([label, value]) => ({ label, value: String(value) }));
}

/**
 * Synthetic, non-persisted sections for a CMS outage. They flow through the
 * same resolver as real CMS sections, so catalog description/details and the
 * static trust list appear without inventing reviews, story, or FAQ copy.
 * Never use these for an empty (successful) CMS response — empty means the
 * admin configured no sections.
 */
export function buildPdpFallbackSections(
  product: ProductDetailDto,
): Section[] {
  const pageKey = pdpPageKey(product.id) ?? `pdp-${product.id.toLowerCase()}`;
  const trustItems = PRODUCT_TRUST_ITEMS.map((item) => ({
    id: item.id,
    icon: item.icon,
    title: item.title,
    description: item.description,
  }));
  return [
    {
      key: "pdp-fallback-description",
      pageKey,
      type: "pdp_description",
      sortOrder: 0,
      isActive: true,
      content: {},
    },
    {
      key: "pdp-fallback-details",
      pageKey,
      type: "pdp_details",
      sortOrder: 1,
      isActive: true,
      content: {},
    },
    {
      key: "pdp-fallback-trust",
      pageKey,
      type: "pdp_trust",
      sortOrder: 2,
      isActive: true,
      content: { items: trustItems },
    },
    {
      key: "pdp-fallback-related",
      pageKey,
      type: "pdp_related",
      sortOrder: 3,
      isActive: true,
      content: { source: "category", title: "You may also like" },
    },
  ] as Section[];
}
