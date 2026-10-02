/**
 * Auth CMS settings fetcher — Oceanic Blue v1.0
 * (Documentation/pages/auth-design.md §6 + AGENTS.md §2 line 3)
 *
 * Server-only (reads env + cookies-free service fetch; never import from a
 * Client Component). Cache-first: Redis-style cache hit renders in ~0.5ms;
 * source miss/failure falls back to stale cache; total failure returns null
 * and the resolver treats it as absent (builtins render — never blank).
 *
 * Source and cache are injected interfaces so tests stub them with zero
 * mocks of the network. The default source speaks the future cms-svc shape
 * (GET /api/v1/cms/pages/:pageKey → { content, version }).
 *
 * REASON FOR ?? HERE: cache/source misses are cascade misses by design —
 * same absent-means-inherit philosophy as resolveSettings.ts.
 */

import type { AuthSettings } from "@/lib/auth/settings";

export interface AuthSettingsEntry {
  settings: AuthSettings;
  version: number;
}

export interface AuthSettingsResult {
  /** Null only when source AND cache both fail (resolver renders builtins). */
  settings: AuthSettings | null;
  version: number | null;
  /** True when served from cache after a source failure. */
  stale: boolean;
}

export interface AuthSettingsSource {
  fetchPage(pageKey: string, signal: AbortSignal): Promise<AuthSettingsEntry | null>;
}

export interface AuthSettingsCache {
  get(pageKey: string): AuthSettingsEntry | null;
  set(pageKey: string, entry: AuthSettingsEntry, ttlSeconds: number): void;
}

export interface FetchAuthSettingsDeps {
  source: AuthSettingsSource;
  cache: AuthSettingsCache;
  /** Source timeout; slow CMS never blocks a render. Default 1500ms. */
  timeoutMs?: number;
  /** Cache TTL on population. Default 300s. */
  cacheTtlSeconds?: number;
}

export const AUTH_SETTINGS_CACHE_TTL_SECONDS = 300;
export const AUTH_SETTINGS_TIMEOUT_MS = 1500;

export async function fetchAuthSettings(
  pageKey: string,
  deps: FetchAuthSettingsDeps,
): Promise<AuthSettingsResult> {
  const timeoutMs = deps.timeoutMs ?? AUTH_SETTINGS_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const fresh = await deps.source.fetchPage(pageKey, controller.signal);
    if (fresh) {
      deps.cache.set(pageKey, fresh, deps.cacheTtlSeconds ?? AUTH_SETTINGS_CACHE_TTL_SECONDS);
      return { settings: fresh.settings, version: fresh.version, stale: false };
    }
  } catch {
    // Source failure (network, timeout, 5xx): fall through to stale cache.
  } finally {
    clearTimeout(timer);
  }
  const cached = deps.cache.get(pageKey);
  if (cached) {
    return { settings: cached.settings, version: cached.version, stale: true };
  }
  return { settings: null, version: null, stale: false };
}

/** Default source against cms-svc (active once cms-svc lands). */
export function createCmsSource(
  baseUrl: string,
  fetchFn: typeof fetch = fetch,
): AuthSettingsSource {
  return {
    async fetchPage(pageKey: string, signal: AbortSignal): Promise<AuthSettingsEntry | null> {
      const res = await fetchFn(`${baseUrl}/api/v1/cms/pages/${pageKey}`, { signal });
      if (!res.ok) return null;
      const body = (await res.json()) as { content?: AuthSettings; version?: number };
      if (!body || typeof body.content !== "object" || typeof body.version !== "number") return null;
      return { settings: body.content, version: body.version };
    },
  };
}
