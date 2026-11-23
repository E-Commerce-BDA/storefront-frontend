/**
 * Gallery images — sf-051
 * (product.md §14: the Gallery block paints; this file decides what it paints)
 *
 * catalog sends `images[]` in whatever order the admin saved, with one row
 * flagged `isPrimary` and the rest carrying `sortOrder`. Three facts follow,
 * and all three are bugs if the block has to remember them:
 *
 * - **Primary first**, because a PDP whose first frame is the fourth photo
 *   looks like the wrong product.
 * - **Deduped by url**, because an admin who uploads the same shot twice would
 *   otherwise get a thumb that changes nothing when tapped — a dead control,
 *   invisible in review.
 * - **A stable order when nothing is flagged**, so the gallery does not
 *   reshuffle between two renders of the same product.
 */

import type { ProductImageDto } from "@/lib/catalog/schemas";
import { PRODUCT_CARD_RATIOS, type MediaRatio } from "./productCard";

export interface GalleryImage {
  url: string;
  alt: string;
}

export const GALLERY_DEFAULT_RATIO: MediaRatio = "4:5";

/**
 * Upper bound on the PDP thumb rail. The seed keeps every product at 2-6 images,
 * but the display caps at 6 regardless of what the catalog returns, so a product
 * an admin over-photographs never floods the rail.
 */
export const GALLERY_MAX_IMAGES = 6;

/**
 * Primary first → `sortOrder` ascending → upload order, empty urls dropped.
 *
 * The one home of that order: the PDP rail and the card's cover both read it, so
 * the same product cannot open on a different frame in the two places. Exposed
 * for that reason — `lib/commerce/fromCatalog.ts` maps the rows further and must
 * not re-derive the rule.
 */
export function orderImageRows(
  images: readonly ProductImageDto[] | null | undefined,
): ProductImageDto[] {
  return (images ?? [])
    .map((image, index) => ({ image, index }))
    .filter(({ image }) => typeof image.url === "string" && image.url.trim() !== "")
    .sort((a, b) => {
      const primary =
        Number(b.image.isPrimary === true) - Number(a.image.isPrimary === true);
      if (primary !== 0) return primary;

      const order =
        (a.image.sortOrder ?? Number.MAX_SAFE_INTEGER) -
        (b.image.sortOrder ?? Number.MAX_SAFE_INTEGER);
      return order !== 0 ? order : a.index - b.index;
    })
    .map(({ image }) => image);
}

/**
 * Primary first → `sortOrder` ascending → upload order.
 *
 * Empty urls are dropped (`<img src="">` re-requests the page), duplicates keep
 * their first occurrence *after* ordering, so the primary row's alt text wins
 * over a later copy's.
 */
export function toGalleryImages(
  images: readonly ProductImageDto[] | null | undefined,
  fallbackAlt = "",
): GalleryImage[] {
  const ranked = orderImageRows(images);

  const seen = new Set<string>();
  const gallery: GalleryImage[] = [];
  for (const image of ranked) {
    if (seen.has(image.url)) continue;
    seen.add(image.url);
    gallery.push({
      url: image.url,
      alt: image.alt !== null && image.alt !== undefined && image.alt.trim() !== ""
        ? image.alt
        : fallbackAlt,
    });
  }
  return gallery;
}

export function stepIndex(index: number, delta: number, length: number): number {
  if (length <= 0) return 0;
  const next = (index + delta) % length;
  return next < 0 ? next + length : next;
}

export function clampIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  if (!Number.isFinite(index)) return 0;
  return Math.min(Math.max(0, Math.trunc(index)), length - 1);
}

export function ratioCss(ratio: MediaRatio): string {
  return PRODUCT_CARD_RATIOS[ratio];
}
