/**
 * Recently viewed products cookie — sf_rv
 *
 * Keeps up to 8 product slugs, deduped, with 30-day TTL.
 * Sits in HttpOnly cookie so it persists across sessions without localStorage.
 */

export const RECENTLY_VIEWED_COOKIE = "sf_rv";
export const RECENTLY_VIEWED_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days
export const RECENTLY_VIEWED_MAX = 8;

export function parseRecentlyViewed(cookieHeader?: string | null): string[] {
  if (!cookieHeader || !cookieHeader.trim()) return [];
  return cookieHeader
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.length <= 80);
}

export function serializeRecentlyViewed(slugs: string[]): string {
  return slugs.join(",");
}

export function appendRecentlyViewed(
  existing: string[],
  slug: string,
  max = RECENTLY_VIEWED_MAX,
): string[] {
  const clean = slug.trim();
  if (!clean) return existing;
  const filtered = existing.filter((s) => s !== clean);
  return [clean, ...filtered].slice(0, max);
}
