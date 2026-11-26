/**
 * Site brand identity — pure constants.
 *
 * Mirrors the demo manifest (`ecom-infra/scripts/demo-seed/manifest.mjs`
 * `SITE.name`). The CMS footer `wordmark` still overrides the visible brand
 * when an admin sets one; this module is only the fallback identity for
 * metadata, blog fallback copy, and route descriptions.
 *
 * `siteUrl()` is the one home for the public origin used by absolute URLs
 * (sitemap, metadataBase, JSON-LD). It reads the env at call time so a test can
 * pin an origin without reimporting the module, and the local fallback keeps
 * the served stack working when no deployment origin is configured.
 */
export const SITE_NAME = "Next.7";
export const SITE_DESCRIPTION = "Everyday clothes built to last: linen, merino, denim.";

export function siteUrl(): string {
  return (process.env.SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
}

/** Home-page `WebSite` node — a plain object, so the route owns the script tag. */
export function buildHomeJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: siteUrl(),
    description: SITE_DESCRIPTION,
  };
}

/**
 * JSON-LD is inert text, but a CMS-branded string could still contain `<` and
 * close the script tag. Escaping it keeps the payload valid JSON (the unicode
 * escape is decoded back to `<` by the JSON parser) without trusting the source.
 */
export function serializeJsonLd(node: Record<string, unknown>): string {
  return JSON.stringify(node).replace(/</g, "\\u003c");
}
