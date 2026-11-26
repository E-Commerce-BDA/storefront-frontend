/**
 * Global theme read — storefront theme architecture.
 *
 * Same total, never-rejects cascade as `lib/cms/footer.ts`: cms-svc
 * `getGlobalSettings()` → in-process stale cache → `null`. In the root layout,
 * `resolveThemeSettings({ settings: null })` returns `DEFAULT_THEME`, which
 * mirrors the component defaults exactly, so an unreadable CMS is a no-op
 * visually. The Next Data Cache tag (`cms:global-settings`) is already
 * attached by `lib/cms/client.ts`; this map is only the within-process layer.
 */

import { incrementMetric } from "@/lib/metrics/counters";
import { createMemoryCache, type TtlCache } from "./cache";
import { cmsBaseUrl, createCmsClient, type CmsClient } from "./client";
import type { ThemeSettings } from "./themeSettings";

export const THEME_CACHE_KEY = "theme";
export const THEME_CACHE_TTL_SECONDS = 300;

export interface ThemeSource {
  fetchTheme(): Promise<ThemeSettings | null>;
}

export interface FetchThemeDeps {
  source?: ThemeSource;
  cache?: TtlCache<ThemeSettings>;
  cacheTtlSeconds?: number;
}

export interface ThemeResult {
  theme: ThemeSettings | null;
  stale: boolean;
  fallback: boolean;
}

/** Process-local stale store; survives between requests, resets on deploy. */
const themeCache = createMemoryCache<ThemeSettings>();

export function createCmsThemeSource(
  client: CmsClient = createCmsClient({ baseUrl: cmsBaseUrl() }),
): ThemeSource {
  return {
    async fetchTheme(): Promise<ThemeSettings | null> {
      const response = await client.getGlobalSettings();
      return response.data === null ? null : response.data.theme;
    },
  };
}

/**
 * Never rejects. `client.getGlobalSettings()` already returns `null` on
 * network, timeout, non-2xx or an envelope the schema refuses, so the only
 * thing left to catch is a throwing cache — a root-layout read must not blank
 * every route because theme was unreadable.
 */
export async function fetchThemeSettings(deps: FetchThemeDeps = {}): Promise<ThemeResult> {
  const cache = deps.cache ?? themeCache;
  const source = deps.source ?? createCmsThemeSource();

  try {
    const fresh = await source.fetchTheme();
    if (fresh !== null) {
      cache.set(THEME_CACHE_KEY, fresh, deps.cacheTtlSeconds ?? THEME_CACHE_TTL_SECONDS);
      return { theme: fresh, stale: false, fallback: false };
    }
  } catch {
    // Source failure: fall through to the stale cache.
  }

  try {
    const cached = cache.get(THEME_CACHE_KEY);
    if (cached) {
      incrementMetric("cms_stale_reads_total");
      return { theme: cached, stale: true, fallback: false };
    }
  } catch {
    // Ignore — the builtin theme is a better answer than a 500.
  }

  incrementMetric("cms_fallback_reads_total");
  return { theme: null, stale: false, fallback: true };
}
