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

/**
 * I-02: distinguish "the service answered" from "the service failed" and from
 * "the document genuinely does not exist". A 404 is the only absence a route may
 * turn into notFound(); every other non-2xx or bad body is an outage.
 */
export interface CmsRead<T> {
  data: T | null;
  status: number;
  code: string | null;
}
export function cmsMissing<T>(status: number, code: string | null = null): CmsRead<T> {
  return { data: null, status, code };
}
export function cmsFound<T>(data: T): CmsRead<T> {
  return { data, status: 200, code: null };
}

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
  getPageSettings(pageKey: string): Promise<CmsRead<CmsPageSettings>>;
  getGlobalSettings(): Promise<CmsRead<CmsGlobalSettings>>;
  getNavigation(): Promise<CmsRead<CmsNavigation>>;
  /** contracts 2.1.0 adds optional `state` and `configured`; older responses omit them. */
  getSections(pageKey: string): Promise<CmsRead<SectionListResponse & { state?: "missing" | "empty" | "published"; skipped?: SectionSkip[] }>>;
  getFooter(): Promise<CmsRead<FooterResponse>>;
  listBlogs(query?: CmsBlogListQuery): Promise<CmsRead<BlogListResponse>>;
  getBlog(slug: string): Promise<CmsRead<Blog>>;
  getPage(slug: string): Promise<CmsRead<Page>>;
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
  /** Preview token for inactive/draft reads; cms-svc ignores invalid tokens. */
  previewToken?: string;
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

  async function get(
    path: string,
    tag: string,
  ): Promise<CmsRead<unknown>> {
    try {
      const response = await fetchFn(`${baseUrl}${path}`, {
        headers: {
          accept: "application/json",
          // Invalid tokens are ignored by cms-svc, so never surface an error.
          ...(options.previewToken ? { "x-preview-token": options.previewToken } : {}),
        },
        signal: AbortSignal.timeout(timeoutMs),
        next: { tags: [tag], revalidate },
      });
      if (!response.ok) return cmsMissing(response.status);
      return cmsFound(await response.json());
    } catch {
      return cmsMissing(0, "NETWORK_ERROR");
    }
  }

  return {
    async getPageSettings(pageKey) {
      // A bad key would become a path segment — refuse before the request.
      if (!isPageKey(pageKey)) return cmsMissing(400, "INVALID_KEY");
      const read = await get(
        `/api/v1/cms/settings/page/${pageKey}`,
        cmsTag.pageSettings(pageKey),
      );
      return parseSettings(read, "settings");
    },

    async getGlobalSettings() {
      const read = await get("/api/v1/cms/settings/global", cmsTag.globalSettings);
      return parseSettings(read, "theme");
    },

    async getNavigation() {
      const read = await get("/api/v1/cms/navigation", cmsTag.navigation);
      return parseSettings(read, "navbar");
    },


    async getSections(pageKey) {
      // A bad key would mint an off-allowlist tag — refuse before the request.
      if (!isPageKey(pageKey)) return cmsMissing(400, "INVALID_KEY");
      const read = await get(
        `/api/v1/cms/sections?pageKey=${encodeURIComponent(pageKey)}`,
        cmsTag.sections(pageKey),
      );
      if (read.data === null) return cmsMissing(read.status, read.code);
      // Tolerant parse: validate the outer envelope, then each section.
      // One unknown/invalid section must not blank the page — it is reported
      // in `skipped` so the route can say why, not silently disappear (I-17).
      const envelope = sectionListEnvelopeSchema.safeParse(read.data);
      if (!envelope.success) return cmsMissing(read.status, "CONTRACT_MISMATCH");
      const skipped: SectionSkip[] = [];
      const sections = envelope.data.sections.flatMap((raw, index) => {
        const parsed = sectionSchema.safeParse(raw);
        if (!parsed.success) {
          skipped.push({
            index,
            key: typeof raw === "object" && raw !== null && "key" in raw ? String(raw.key) : "",
            reason: parsed.error.issues[0]?.message ?? "invalid section",
          });
          return [];
        }
        return [parsed.data];
      });
      return cmsFound({
        sections,
        version: envelope.data.version,
        // contracts 2.1.0 carries the CMS state; older responses omit it.
        ...(typeof (envelope.data as Record<string, unknown>).state === "string"
          ? { state: (envelope.data as Record<string, unknown>).state as "missing" | "empty" | "published" }
          : {}),
        skipped,
      });
    },

    async getFooter() {
      const read = await get("/api/v1/cms/footer", cmsTag.footer);
      if (read.data === null) return cmsMissing(read.status, read.code);
      const parsed = footerResponseSchema.safeParse(read.data);
      return parsed.success
        ? cmsFound(parsed.data)
        : cmsMissing(read.status, "CONTRACT_MISMATCH");
    },

    async listBlogs(query) {
      const params = new URLSearchParams();
      if (query?.category) params.set("category", query.category);
      if (query?.cursor) params.set("cursor", query.cursor);
      if (query?.limit) params.set("limit", String(query.limit));
      const qs = params.toString();
      const path = `/api/v1/cms/blogs${qs ? `?${qs}` : ""}`;
      const read = await get(path, cmsTag.blogs);
      if (read.data === null) return cmsMissing(read.status, read.code);
      const parsed = blogListResponseSchema.safeParse(read.data);
      return parsed.success
        ? cmsFound(parsed.data)
        : cmsMissing(read.status, "CONTRACT_MISMATCH");
    },

    async getBlog(slug) {
      if (!isPageKey(slug)) return cmsMissing(400, "INVALID_KEY");
      const read = await get(
        `/api/v1/cms/blogs/${encodeURIComponent(slug)}`,
        cmsTag.blogs,
      );
      if (read.data === null) return cmsMissing(read.status, read.code);
      const blog =
        typeof read.data === "object" && read.data !== null && "blog" in read.data
          ? (read.data as { blog: unknown }).blog
          : read.data;
      const parsed = blogSchema.safeParse(blog);
      return parsed.success
        ? cmsFound(parsed.data)
        : cmsMissing(read.status, "CONTRACT_MISMATCH");
    },

    async getPage(slug) {
      if (!isPageKey(slug)) return cmsMissing(400, "INVALID_KEY");
      const read = await get(
        `/api/v1/cms/pages/${encodeURIComponent(slug)}`,
        cmsTag.pages(slug),
      );
      if (read.data === null) return cmsMissing(read.status, read.code);
      // The controller wraps the page in `{ page }`; unwrap before parsing.
      const page =
        typeof read.data === "object" && read.data !== null && "page" in read.data
          ? (read.data as { page: unknown }).page
          : read.data;
      const parsed = pageSchema.safeParse(page);
      return parsed.success
        ? cmsFound(parsed.data)
        : cmsMissing(read.status, "CONTRACT_MISMATCH");
    },
  };
}

function asEnvelope(
  body: unknown,
  key: "settings" | "theme" | "navbar",
): { payload: Record<string, unknown>; version: number; configured?: boolean } | null {
  if (typeof body !== "object" || body === null || Array.isArray(body)) return null;
  const record = body as Record<string, unknown>;
  const payload = record[key];
  const version = record.version;
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) return null;
  if (typeof version !== "number" || !Number.isFinite(version)) return null;
  return {
    payload: payload as Record<string, unknown>,
    version,
    ...(typeof record.configured === "boolean" ? { configured: record.configured } : {}),
  };
}

/** Settings readers keep their historical envelope guard; carry status through. */
function parseSettings<T extends { version: number }>(
  read: CmsRead<unknown>,
  key: "settings" | "theme" | "navbar",
): CmsRead<T & { configured?: boolean }> {
  if (read.data === null) return cmsMissing(read.status, read.code);
  const envelope = asEnvelope(read.data, key);
  if (envelope === null) return cmsMissing(read.status, "CONTRACT_MISMATCH");
  // Keep the historical shape { settings|theme|navbar, version } that every
  // caller already destructures; `configured` rides alongside for I-01.
  const data = {
    [key]: envelope.payload,
    version: envelope.version,
    ...(envelope.configured === undefined ? {} : { configured: envelope.configured }),
  } as unknown as T & { configured?: boolean };
  return cmsFound(data);
}

export interface SectionSkip {
  index: number;
  key: string;
  reason: string;
}
