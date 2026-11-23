/**
 * CMS cache tags — sf-050, extended by sf-060
 *
 * One vocabulary shared by the readers (`lib/cms/client.ts`) and the writer
 * (`app/api/revalidate/route.ts`). If the tag strings lived in two places, a
 * rename would silently stop invalidating anything — the cache would keep
 * serving the old nav with no error anywhere.
 *
 * The page-key pattern is also the allowlist: `POST /api/revalidate` only
 * accepts tags this module can produce, so a caller cannot mint an arbitrary
 * cache key.
 *
 * PARITY CONTRACT: every string here must equal `storefrontTags` in
 * `cms-svc/src/revalidate/revalidate.service.ts`. cms-svc sends these tags;
 * this allowlist is what the storefront route agrees to honour. Add a tag on
 * one side and you MUST add it on the other, or a publish 400s into a warn
 * line and the page silently stays stale. A cms-svc spec asserts the pairs.
 */

export const CMS_PAGE_SETTINGS_PREFIX = "cms:page-settings:";
export const CMS_SECTIONS_PREFIX = "cms:sections:";
export const CMS_PAGES_PREFIX = "cms:pages:";
export const CMS_GLOBAL_SETTINGS_TAG = "cms:global-settings";
export const CMS_NAVIGATION_TAG = "cms:navigation";
export const CMS_FOOTER_TAG = "cms:footer";
export const CMS_BLOGS_TAG = "cms:blogs";

export const CMS_STATIC_TAGS = [
  CMS_GLOBAL_SETTINGS_TAG,
  CMS_NAVIGATION_TAG,
  CMS_FOOTER_TAG,
  CMS_BLOGS_TAG,
] as const;

/** Page keys / slugs cms-svc accepts: lowercase slugs, deliberately short. */
const PAGE_KEY_RE = /^[a-z0-9-]{1,80}$/;

export const cmsTag = {
  pageSettings(pageKey: string): string {
    return `${CMS_PAGE_SETTINGS_PREFIX}${pageKey}`;
  },
  sections(pageKey: string): string {
    return `${CMS_SECTIONS_PREFIX}${pageKey}`;
  },
  pages(slug: string): string {
    return `${CMS_PAGES_PREFIX}${slug}`;
  },
  globalSettings: CMS_GLOBAL_SETTINGS_TAG,
  navigation: CMS_NAVIGATION_TAG,
  footer: CMS_FOOTER_TAG,
  blogs: CMS_BLOGS_TAG,
} as const;

export function isPageKey(value: unknown): value is string {
  return typeof value === "string" && PAGE_KEY_RE.test(value);
}

/**
 * True for any tag the readers can produce. The three parameterised prefixes
 * (page-settings, sections, pages) all key off the same page-key/slug shape,
 * so one regex guards all of them.
 */
export function isAllowedTag(tag: unknown): tag is string {
  if (typeof tag !== "string") return false;
  if ((CMS_STATIC_TAGS as readonly string[]).includes(tag)) return true;
  for (const prefix of [
    CMS_PAGE_SETTINGS_PREFIX,
    CMS_SECTIONS_PREFIX,
    CMS_PAGES_PREFIX,
  ]) {
    if (tag.startsWith(prefix)) {
      return isPageKey(tag.slice(prefix.length));
    }
  }
  return false;
}
