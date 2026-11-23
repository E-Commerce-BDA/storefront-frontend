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
 * Note on validation: the settings readers keep the historical envelope guard
 * (`version` is a number, the payload is an object) because their fallbacks
 * already treat a wrong-typed field as a miss. The sf-060 readers
 * (`getFooter`/`listBlogs`/`getBlog`/`getPage`) instead parse through the
 * `@ecom/contracts` response schemas, while `getSections` validates the
 * envelope and parses per-section so one unknown section cannot blank the
 * page.
 */

import {
  blogListResponseSchema,
  blogSchema,
  type Blog,
  type BlogListResponse,
  footerResponseSchema,
  type FooterResponse,
  pageSchema,
  type Page,
  sectionListEnvelopeSchema,
  sectionSchema,
  type SectionListResponse,
} from "@ecom/contracts";
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
  getSections(pageKey: string): Promise<SectionListResponse | null>;
  getFooter(): Promise<FooterResponse | null>;
  listBlogs(query?: CmsBlogListQuery): Promise<BlogListResponse | null>;
  getBlog(slug: string): Promise<Blog | null>;
  getPage(slug: string): Promise<Page | null>;
}

export interface CmsBlogListQuery {
  category?: string;
  cursor?: string;
  limit?: number;
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


    async getSections(pageKey) {
      // A bad key would mint an off-allowlist tag — refuse before the request.
      if (!isPageKey(pageKey)) return null;
      const body = await get(
        `/api/v1/cms/sections?pageKey=${encodeURIComponent(pageKey)}`,
        cmsTag.sections(pageKey),
      );
      // Tolerant parse: validate the outer envelope, then each section.
      // One unknown/invalid section must not null the whole page — the
      // renderer skips only that section. An invalid envelope is an outage.
      const envelope = sectionListEnvelopeSchema.safeParse(body);
      if (!envelope.success) return null;
      const sections = envelope.data.sections.flatMap((raw, index) => {
        const parsed = sectionSchema.safeParse(raw);
        if (!parsed.success) {
          // reason: no logger in this repo yet; a skipped section is
          // deliberately swallowed so one bad row cannot blank the page.
          console.warn(
            `[cms] skipped invalid section at index ${index} on "${pageKey}": ${parsed.error.issues[0]?.message ?? "unknown"}`,
          );
          return [];
        }
        return [parsed.data];
      });
      return { sections, version: envelope.data.version };
    },

    async getFooter() {
      const body = await get("/api/v1/cms/footer", cmsTag.footer);
      const parsed = footerResponseSchema.safeParse(body);
      return parsed.success ? parsed.data : null;
    },

    async listBlogs(query) {
      const params = new URLSearchParams();
      if (query?.category) params.set("category", query.category);
      if (query?.cursor) params.set("cursor", query.cursor);
      if (query?.limit) params.set("limit", String(query.limit));
      const qs = params.toString();
      const path = `/api/v1/cms/blogs${qs ? `?${qs}` : ""}`;
      const body = await get(path, cmsTag.blogs);
      const parsed = blogListResponseSchema.safeParse(body);
      return parsed.success ? parsed.data : null;
    },

    async getBlog(slug) {
      if (!isPageKey(slug)) return null;
      const body = await get(
        `/api/v1/cms/blogs/${encodeURIComponent(slug)}`,
        cmsTag.blogs,
      );
      const blog =
        typeof body === "object" && body !== null && "blog" in body
          ? (body as { blog: unknown }).blog
          : body;
      const parsed = blogSchema.safeParse(blog);
      return parsed.success ? parsed.data : null;
    },

    async getPage(slug) {
      if (!isPageKey(slug)) return null;
      const body = await get(
        `/api/v1/cms/pages/${encodeURIComponent(slug)}`,
        cmsTag.pages(slug),
      );
      // The controller wraps the page in `{ page }`; unwrap before parsing.
      const page =
        typeof body === "object" && body !== null && "page" in body
          ? (body as { page: unknown }).page
          : body;
      const parsed = pageSchema.safeParse(page);
      return parsed.success ? parsed.data : null;
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
