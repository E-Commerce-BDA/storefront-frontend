/**
 * Open-redirect guard — sf-049
 *
 * `/signin?next=`, `/api/auth/refresh?next=` and the proxy all resume a
 * shopper to a path that arrives from the URL, so every one of them has to
 * answer the same question: is this a path I own? Anything else falls back to
 * `/account` rather than to the raw value — a redirect to `//evil.com` or
 * `https://evil.com` is a phishing handoff with our domain in the link.
 *
 * Promoted from the regex that used to be inlined in
 * `app/(auth)/signin/page.tsx` (the old `TODO` there), now shared by the page,
 * the refresh route and the proxy so the three cannot drift.
 */

export const DEFAULT_NEXT_PATH = "/account";

const INTERNAL_NEXT_RE = /^\/(account|checkout|cart)(\/|$|\?)/;

export function safeNextPath(value: unknown): string {
  if (typeof value !== "string") return DEFAULT_NEXT_PATH;

  const candidate = value.trim();
  if (candidate.length === 0) return DEFAULT_NEXT_PATH;

  // Scheme-relative (`//host`) and backslash tricks are absolute redirects in
  // every browser that matters, even though they look like paths.
  if (candidate.startsWith("//") || candidate.includes("\\")) {
    return DEFAULT_NEXT_PATH;
  }

  if (!INTERNAL_NEXT_RE.test(candidate)) return DEFAULT_NEXT_PATH;

  // A control character would let a caller smuggle a second header value past
  // a naive consumer of this string.
  if (/[\u0000-\u001f\u007f]/.test(candidate)) return DEFAULT_NEXT_PATH;

  return candidate;
}
