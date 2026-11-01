/**
 * Product JSON-LD — sf-051
 * (plan §8 PDP: meta / OG / JSON-LD; routing.md §5.4 per-variant offers)
 *
 * Rich results come from structured data, not prose, and the rule routing.md §5
 * states is that the **canonical bare slug** page carries every variant as an
 * `offers[]` entry — variant richness without URL sprawl. This is the one place
 * that shape is decided, so the page just drops the object into a script tag.
 *
 * A handful of honest limits:
 *
 * - **Money is a number** (ADR 41), so `price` is serialised straight; there is
 *   no string to coerce and no `parseFloat` to forget.
 * - **Availability is per offer.** `stock > 0` is the same cut the card and the
 *   panel use — a JSON-LD that called an out-of-stock variant `InStock` would
 *   promise shoppers a page that then tells them no.
 * - **A product with no variants still needs one offer**, drawn from the product
 *   row itself, or Google sees a `Product` with nothing to buy.
 * - **Currency is fixed to USD for now.** Nothing upstream carries a currency, so
 *   guessing per-region would be a lie; multi-currency is a contract concern and
 *   lands with sf-053.
 */

import type { ProductDetailDto } from "@/lib/catalog/schemas";

const CONTEXT = "https://schema.org";
/** Placeholder until the catalog carries a currency (sf-053). */
export const PDP_PRICE_CURRENCY = "USD";

function availabilityUrl(stock: number | null | undefined): string {
  return typeof stock === "number" && stock > 0
    ? `${CONTEXT}/InStock`
    : `${CONTEXT}/OutOfStock`;
}

/**
 * The `Product` node. Returned as a plain object so the caller controls how it is
 * embedded (`<script type="application/ld+json">{...}</script>` via
 * `JSON.stringify`), and this stays node-testable with no DOM.
 *
 * No absolute URL is baked in: routing.md §5.4 asks only for per-variant
 * `price / availability / sku / image`, and inventing a host here would freeze a
 * wrong canonical into the structured data.
 */
export function buildProductJsonLd(product: ProductDetailDto): Record<string, unknown> {
  const images = (product.images ?? [])
    .map((image) => image.url)
    .filter((src) => typeof src === "string" && src.trim() !== "");

  const offers =
    product.variants.length > 0
      ? product.variants.map((variant) => ({
          "@type": "Offer",
          price: variant.price,
          priceCurrency: PDP_PRICE_CURRENCY,
          availability: availabilityUrl(variant.stock),
          sku: variant.sku,
          ...(variant.imageUrl ? { image: variant.imageUrl } : {}),
        }))
      : [
          {
            "@type": "Offer",
            // The purchasable figure the shopper sees is the effective price.
            price: product.effectivePrice ?? product.price,
            priceCurrency: PDP_PRICE_CURRENCY,
            availability: availabilityUrl(product.stock),
            ...(product.sku ? { sku: product.sku } : {}),
          },
        ];

  return {
    "@context": CONTEXT,
    "@type": "Product",
    name: product.name,
    ...(product.sku ? { sku: product.sku } : {}),
    ...(product.shortDescription ? { description: product.shortDescription } : {}),
    ...(images.length > 0 ? { image: images } : {}),
    ...(product.brand?.name ? { brand: { "@type": "Brand", name: product.brand.name } } : {}),
    offers,
  };
}
