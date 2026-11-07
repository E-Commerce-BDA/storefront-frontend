/**
 * Site brand identity — pure constant.
 *
 * Mirrors the demo manifest (`ecom-infra/scripts/demo-seed/manifest.mjs`
 * `SITE.name`). The CMS footer `wordmark` still overrides the visible brand
 * when an admin sets one; this module is only the fallback identity for
 * metadata, blog fallback copy, and route descriptions.
 */
export const SITE_NAME = "Next.7";
