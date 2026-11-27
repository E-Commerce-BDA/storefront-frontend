/**
 * CMS fetch cache policy — sf-096. Pure.
 *
 * A preview token travels in an HTTP header, which is NOT part of the Next Data
 * Cache key. A preview fetch that kept the published tag would therefore let a
 * draft answer a shopper (and a published answer an admin) until revalidation.
 * Bypassing the Data Cache for preview reads is the only way to keep the two
 * audiences apart without minting a second invalidation path.
 *
 * Rejected: a preview-only tag. It still stores drafts in a shared cache and
 * would need a purge on every admin save — exactly the propagation problem the
 * webhook already solves for published content.
 */

export const CMS_REVALIDATE_SECONDS = 300;

export interface CmsFetchCacheInit {
  cache?: "no-store";
  next?: { tags: string[]; revalidate: number };
}

/**
 * `previewToken` is null/undefined/empty for a published read. The revalidate
 * argument exists for callers that deliberately shorten the published ceiling;
 * preview never uses it, so no preview value can be stored under a tag.
 */
export function cmsFetchCache(
  tag: string,
  previewToken: string | null | undefined,
  revalidateSeconds = CMS_REVALIDATE_SECONDS,
): CmsFetchCacheInit {
  if (typeof previewToken === "string" && previewToken.trim() !== "") {
    return { cache: "no-store" };
  }
  return { next: { tags: [tag], revalidate: revalidateSeconds } };
}
