/**
 * CMS client — sf-050
 * (Documentation/services/cms.md · 1.Architecture.md §6.5)
 *
 * Server-only. The one place the storefront talks to cms-svc, so the tag
 * vocabulary and the budget live here rather than at each call site.
 *
 * Every request is a Next Data Cache read:
 *   fetch(url, { next: { tags: [tag], revalidate: 300 } })
 * which is what makes `POST /api/revalidate` → `revalidateTag(tag, 'max')`
 * actually drop something. A plain `fetch` here would still render, it just
 * would never be invalidatable — the webhook would be decoration.
 *
 * WHY null instead of throwing: every caller has a documented fallback
 * (`fetchAuthSettings` → builtins, `fetchNavSettings` → DEMO_NAV_INPUT), so a
 * CMS outage must be a value, not an exception. The same reason the timeout is
 * 2 s: a slow CMS is a slow render, and a shopper would rather see yesterday's
 * navbar than a blank one.
 *
 * Note on validation: the guard checks the envelope (`version` is a number,
 * the payload is an object) and then trusts the body. That is deliberate —
 * `resolveAuthSettings`/`resolveNavSettings` already treat a wrong-typed field
 * as a miss and fall back to builtins, so a stricter schema here would only
 * duplicate them. Swapping in `@ecom/contracts` schemas once the storefront
 * repins past 1.7.0 is recorded as a follow-up.
 */

import type { AuthSettings } from "@/lib/auth/settings";
import type { ThemeSettings } from "@/lib/cms/themeSettings";
import { serviceUrl } from "@/lib/services/urls";
import type { NavSettings } from "@/lib/shell/navSettings";
import { cmsTag, isPageKey } from "./tags";

export const CMS_TIMEOUT_MS = 2000;
export const CMS_REVALIDATE_SECONDS = 300;

export interface CmsPageSettings {
  settings: AuthSettings;
  version: number;
}

export interface CmsGlobalSettings {
  theme: ThemeSettings;
  version: number;
}

export interface CmsNavigation {
  navbar: NavSettings;
  version: number;
}

export interface CmsClient {
  getPageSettings(pageKey: string): Promise<CmsPageSettings | null>;
  getGlobalSettings(): Promise<CmsGlobalSettings | null>;
  getNavigation(): Promise<CmsNavigation | null>;
}

export interface CmsClientOptions {
  baseUrl: string;
  fetchFn?: typeof fetch;
  timeoutMs?: number;
  revalidateSeconds?: number;
}

/**
 * Where cms-svc lives. Read at call time, not at module load, so a test can
 * set the variable before importing. The registry owns the fallback and the
 * trailing-slash trim; `CMS_BASE_URL` keeps its historic name.
 */
export function cmsBaseUrl(): string {
  return serviceUrl("cms", process.env.CMS_BASE_URL);
}

export function createCmsClient(options: CmsClientOptions): CmsClient {
  const baseUrl = options.baseUrl.replace(/\/+$/, "");
  const fetchFn = options.fetchFn ?? fetch;
  const timeoutMs = options.timeoutMs ?? CMS_TIMEOUT_MS;
  const revalidate = options.revalidateSeconds ?? CMS_REVALIDATE_SECONDS;

  async function get(path: string, tag: string): Promise<unknown | null> {
    try {
      const response = await fetchFn(`${baseUrl}${path}`, {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(timeoutMs),
        next: { tags: [tag], revalidate },
      });
      if (!response.ok) return null;
      return await response.json();
    } catch {
      // Network, abort/timeout, or a body that is not JSON.
      return null;
    }
  }

  return {
    async getPageSettings(pageKey) {
      // A bad key would become a path segment — refuse before the request.
      if (!isPageKey(pageKey)) return null;
      const body = await get(
        `/api/v1/cms/settings/page/${pageKey}`,
        cmsTag.pageSettings(pageKey),
      );
      const envelope = asEnvelope(body, "settings");
      return envelope === null
        ? null
        : { settings: envelope.payload as AuthSettings, version: envelope.version };
    },

    async getGlobalSettings() {
      const body = await get("/api/v1/cms/settings/global", cmsTag.globalSettings);
      const envelope = asEnvelope(body, "theme");
      return envelope === null
        ? null
        : { theme: envelope.payload as ThemeSettings, version: envelope.version };
    },

    async getNavigation() {
      const body = await get("/api/v1/cms/navigation", cmsTag.navigation);
      const envelope = asEnvelope(body, "navbar");
      return envelope === null
        ? null
        : { navbar: envelope.payload as NavSettings, version: envelope.version };
    },
  };
}

function asEnvelope(
  body: unknown,
  key: "settings" | "theme" | "navbar",
): { payload: Record<string, unknown>; version: number } | null {
  if (typeof body !== "object" || body === null || Array.isArray(body)) return null;
  const record = body as Record<string, unknown>;
  const payload = record[key];
  const version = record.version;
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) return null;
  if (typeof version !== "number" || !Number.isFinite(version)) return null;
  return { payload: payload as Record<string, unknown>, version };
}
