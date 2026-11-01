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
  /** Never empty: a meaningful photo needs a name, so it falls back upstream. */
  alt: string;
}

/** The PDP frame is portrait — same vocabulary as the card (`MediaRatio`). */
export const GALLERY_DEFAULT_RATIO: MediaRatio = "4:5";

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
  const ranked = (images ?? [])
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
    });

  const seen = new Set<string>();
  const gallery: GalleryImage[] = [];
  for (const { image } of ranked) {
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

/** Wrap-around: the last frame's "next" is the first frame, never a no-op. */
export function stepIndex(index: number, delta: number, length: number): number {
  if (length <= 0) return 0;
  const next = (index + delta) % length;
  return next < 0 ? next + length : next;
}

/** A stale `activeIndex` (product changed under the island) still renders. */
export function clampIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  if (!Number.isFinite(index)) return 0;
  return Math.min(Math.max(0, Math.trunc(index)), length - 1);
}

/** `"4:5"` → the CSS `aspect-ratio` value, from the one ratio table. */
export function ratioCss(ratio: MediaRatio): string {
  return PRODUCT_CARD_RATIOS[ratio];
}
