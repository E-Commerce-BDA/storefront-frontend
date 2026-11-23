/**
 * Navigation read — sf-050
 *
 * Same cascade as `fetchAuthSettings` (source → memory cache → builtin), with
 * the builtin being `DEMO_NAV_INPUT`. That ordering is the whole point of the
 * file: the navbar is on every page, so "cms-svc is down" must render the demo
 * chrome instead of throwing a 500 into the root layout.
 *
 * The Next Data Cache is the cross-request layer (`lib/cms/client.ts` sends
 * `next.revalidate`), so this cache is the *in-process* stale fallback. No
 * Redis: the storefront has no client for it, and adding one would make an
 * outage story worse, not better.
 */

import { DEMO_NAV_INPUT } from "@/lib/shell/demoNavInput";
import type { NavSettings } from "@/lib/shell/navSettings";
import { createMemoryCache, type TtlCache } from "./cache";
import { cmsBaseUrl, createCmsClient, type CmsClient } from "./client";

export const NAV_CACHE_KEY = "navigation";
export const NAV_CACHE_TTL_SECONDS = 300;

export interface NavSettingsEntry {
  settings: NavSettings;
  version: number;
}

export interface NavSettingsSource {
  fetchNavigation(): Promise<NavSettingsEntry | null>;
}

export interface FetchNavSettingsDeps {
  source?: NavSettingsSource;
  cache?: TtlCache<NavSettingsEntry>;
  cacheTtlSeconds?: number;
}

export interface NavSettingsResult {
  settings: NavSettings;
  version: number | null;
  stale: boolean;
  /** True when neither source nor cache had anything — demo nav rendered. */
  fallback: boolean;
}

/** Process-local stale store; survives between requests, resets on deploy. */
const navCache = createMemoryCache<NavSettingsEntry>();

export function createCmsNavSource(
  client: CmsClient = createCmsClient({ baseUrl: cmsBaseUrl() }),
): NavSettingsSource {
  return {
    async fetchNavigation(): Promise<NavSettingsEntry | null> {
      const nav = await client.getNavigation();
      return nav === null ? null : { settings: nav.navbar, version: nav.version };
    },
  };
}

export async function fetchNavSettings(
  deps: FetchNavSettingsDeps = {},
): Promise<NavSettingsResult> {
  const cache = deps.cache ?? navCache;
  const source = deps.source ?? createCmsNavSource();

  try {
    const fresh = await source.fetchNavigation();
    if (fresh) {
      cache.set(NAV_CACHE_KEY, fresh, deps.cacheTtlSeconds ?? NAV_CACHE_TTL_SECONDS);
      return { settings: fresh.settings, version: fresh.version, stale: false, fallback: false };
    }
  } catch {
    // Source failure (network, timeout, 5xx): fall through to the stale cache.
  }

  const cached = cache.get(NAV_CACHE_KEY);
  if (cached) {
    return { settings: cached.settings, version: cached.version, stale: true, fallback: false };
  }

  return { settings: DEMO_NAV_INPUT, version: null, stale: false, fallback: true };
}
