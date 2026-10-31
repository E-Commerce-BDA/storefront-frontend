/**
 * CMS cache tags — sf-050
 *
 * One vocabulary shared by the readers (`lib/cms/client.ts`) and the writer
 * (`app/api/revalidate/route.ts`). If the tag strings lived in two places, a
 * rename would silently stop invalidating anything — the cache would keep
 * serving the old nav with no error anywhere.
 *
 * The page-key pattern is also the allowlist: `POST /api/revalidate` only
 * accepts tags this module can produce, so a caller cannot mint an arbitrary
 * cache key.
 */

export const CMS_PAGE_SETTINGS_PREFIX = "cms:page-settings:";
export const CMS_GLOBAL_SETTINGS_TAG = "cms:global-settings";
export const CMS_NAVIGATION_TAG = "cms:navigation";

/** Tags that are not derived from a page key. */
export const CMS_STATIC_TAGS = [CMS_GLOBAL_SETTINGS_TAG, CMS_NAVIGATION_TAG] as const;

/** Page keys cms-svc accepts: lowercase slugs, deliberately short. */
const PAGE_KEY_RE = /^[a-z0-9-]{1,32}$/;

export const cmsTag = {
  pageSettings(pageKey: string): string {
    return `${CMS_PAGE_SETTINGS_PREFIX}${pageKey}`;
  },
  globalSettings: CMS_GLOBAL_SETTINGS_TAG,
  navigation: CMS_NAVIGATION_TAG,
} as const;

export function isPageKey(value: unknown): value is string {
  return typeof value === "string" && PAGE_KEY_RE.test(value);
}

export function isAllowedTag(tag: unknown): tag is string {
  if (typeof tag !== "string") return false;
  if (tag === CMS_GLOBAL_SETTINGS_TAG || tag === CMS_NAVIGATION_TAG) return true;
  if (!tag.startsWith(CMS_PAGE_SETTINGS_PREFIX)) return false;
  return isPageKey(tag.slice(CMS_PAGE_SETTINGS_PREFIX.length));
}
