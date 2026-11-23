/**
 * Page-settings read — sf-050
 *
 * The three auth routes each used to build their own no-op deps:
 * `source: { fetchPage: async () => null }, cache: { get: () => null, ... }`.
 * Sixty lines of "there is no CMS" across three files, and every one of them
 * had to be edited to turn the CMS on. This module is that edit, once.
 *
 * `fetchAuthSettings` still owns the cascade (fresh → stale → null); this only
 * supplies the real source, the tag-bearing fetch, and one shared cache.
 */

import {
  createCmsSource,
  fetchAuthSettings,
  type AuthSettingsCache,
  type AuthSettingsEntry,
  type AuthSettingsResult,
} from "./authSettings";
import { createMemoryCache } from "./cache";
import { cmsBaseUrl } from "./client";

const pageSettingsCache: AuthSettingsCache = createMemoryCache<AuthSettingsEntry>();

export function fetchAuthPageSettings(
  pageKey: string,
  cache: AuthSettingsCache = pageSettingsCache,
): Promise<AuthSettingsResult> {
  return fetchAuthSettings(pageKey, {
    source: createCmsSource(cmsBaseUrl()),
    cache,
  });
}
