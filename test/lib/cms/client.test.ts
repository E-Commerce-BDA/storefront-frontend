/**
 * CMS client — URLs, cache tags, and the "null, never throw" contract.
 *
 * The tag assertion is the important one: without `next.tags` the fetch still
 * renders, so nothing breaks visibly — `POST /api/revalidate` just stops
 * working. That is exactly the kind of regression a test has to catch.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Blog, Page, Section } from "@ecom/contracts";
import { cmsBaseUrl, createCmsClient, CMS_TIMEOUT_MS } from "@/lib/cms/client";

const BASE = "http://cms.test";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function client(handler: () => Promise<Response>) {
  const fetchFn = vi.fn(handler);
  return {
    fetchFn,
    cms: createCmsClient({ baseUrl: BASE, fetchFn: fetchFn as unknown as typeof fetch }),
  };
}

function callOf(fetchFn: ReturnType<typeof client>["fetchFn"]) {
  return fetchFn.mock.calls[0] as unknown as [string, RequestInit & { next?: { tags: string[]; revalidate: number } }];
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getPageSettings", () => {
  it("hits the documented URL with the page tag and the 300 s revalidate", async () => {
    const { cms, fetchFn } = client(async () => json({ settings: { pages: {} }, version: 4 }));

    const result = await cms.getPageSettings("auth");

    expect(result).toEqual({ settings: { pages: {} }, version: 4 });
    const [url, init] = callOf(fetchFn);
    expect(url).toBe(`${BASE}/api/v1/cms/settings/page/auth`);
    expect(init.next).toEqual({ tags: ["cms:page-settings:auth"], revalidate: 300 });
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("refuses a page key that would become a path segment", async () => {
    const { cms, fetchFn } = client(async () => json({ settings: {}, version: 1 }));

    expect(await cms.getPageSettings("../admin")).toBeNull();
    expect(await cms.getPageSettings("Auth")).toBeNull();
    expect(await cms.getPageSettings("")).toBeNull();
    expect(fetchFn).not.toHaveBeenCalled();
  });
});

describe("getGlobalSettings / getNavigation", () => {
  it("reads the theme envelope", async () => {
    const { cms, fetchFn } = client(async () => json({ theme: { button: {} }, version: 2 }));

    expect(await cms.getGlobalSettings()).toEqual({ theme: { button: {} }, version: 2 });
    const [url, init] = callOf(fetchFn);
    expect(url).toBe(`${BASE}/api/v1/cms/settings/global`);
    expect(init.next?.tags).toEqual(["cms:global-settings"]);
  });

  it("reads the navigation envelope", async () => {
    const { cms, fetchFn } = client(async () => json({ navbar: { shared: {} }, version: 9 }));

    expect(await cms.getNavigation()).toEqual({ navbar: { shared: {} }, version: 9 });
    const [url, init] = callOf(fetchFn);
    expect(url).toBe(`${BASE}/api/v1/cms/navigation`);
    expect(init.next?.tags).toEqual(["cms:navigation"]);
  });
});

// --- sf-060 reader fixtures: schema-valid against @ecom/contracts 1.12.0 ----

const SECTION = {
  key: "hero-home",
  pageKey: "homepage",
  type: "hero",
  sortOrder: 0,
  isActive: true,
  content: { slides: [{ id: "slide-1", headline: "New season", image: "/media/seed/hero-1.jpg" }] },
} satisfies Section;

const BLOG = {
  id: "b1",
  slug: "field-notes",
  title: "Field notes",
  content: [{ type: "paragraph", id: "blk-1", text: "Hello." }],
  categoryId: "cat-1",
  status: "published",
} satisfies Blog;

const PAGE = {
  id: "p1",
  slug: "about-us",
  title: "About us",
  blocks: [{ type: "rich_text", id: "blk-1", body: "<p>We build things.</p>" }],
  // `isActive` is `.default(true)` in the contract, so it is present post-parse.
  isActive: true,
} satisfies Page;

describe("getSections", () => {
  it("hits the list URL with the per-page tag and parses the envelope", async () => {
    const { cms, fetchFn } = client(async () => json({ sections: [SECTION], version: 3 }));

    const result = await cms.getSections("homepage");

    expect(result).toEqual({ sections: [SECTION], version: 3 });
    const [url, init] = callOf(fetchFn);
    expect(url).toBe(`${BASE}/api/v1/cms/sections?pageKey=homepage`);
    expect(init.next).toEqual({ tags: ["cms:sections:homepage"], revalidate: 300 });
  });

  it("refuses a bad page key before the request (it would mint an off-allowlist tag)", async () => {
    const { cms, fetchFn } = client(async () => json({ sections: [], version: 1 }));

    expect(await cms.getSections("../admin")).toBeNull();
    expect(await cms.getSections("Homepage")).toBeNull();
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("returns null when a section fails the contracts union", async () => {
    const { cms } = client(async () =>
      json({ sections: [{ ...SECTION, type: "carousel" }], version: 1 }),
    );
    expect(await cms.getSections("homepage")).toBeNull();
  });
});

describe("getFooter", () => {
  it("reads the footer document with the static tag", async () => {
    const footer = { wordmark: "FOREAF", columns: [{ title: "Shop", links: [{ label: "Products", href: "/products" }] }] };
    const { cms, fetchFn } = client(async () => json({ footer, version: 7 }));

    expect(await cms.getFooter()).toEqual({ footer, version: 7 });
    const [url, init] = callOf(fetchFn);
    expect(url).toBe(`${BASE}/api/v1/cms/footer`);
    expect(init.next?.tags).toEqual(["cms:footer"]);
  });

  it("accepts the empty pre-publish document", async () => {
    const { cms } = client(async () => json({ footer: {}, version: 0 }));
    expect(await cms.getFooter()).toEqual({ footer: {}, version: 0 });
  });

  it("returns null on a body the contract refuses", async () => {
    const { cms } = client(async () => json({ footer: { newsletterForm: true }, version: 1 }));
    expect(await cms.getFooter()).toBeNull();
  });
});

describe("listBlogs / getBlog", () => {
  it("builds the query string and pins the blogs tag", async () => {
    const { cms, fetchFn } = client(async () => json({ data: [BLOG], nextCursor: null }));

    const result = await cms.listBlogs({ category: "news", cursor: "c-2", limit: 9 });

    expect(result).toEqual({ data: [BLOG], nextCursor: null });
    const [url, init] = callOf(fetchFn);
    expect(url).toBe(`${BASE}/api/v1/cms/blogs?category=news&cursor=c-2&limit=9`);
    expect(init.next?.tags).toEqual(["cms:blogs"]);
  });

  it("sends no query string when there is nothing to filter", async () => {
    const { cms, fetchFn } = client(async () => json({ data: [], nextCursor: null }));

    await cms.listBlogs();

    expect(callOf(fetchFn)[0]).toBe(`${BASE}/api/v1/cms/blogs`);
  });

  it("unwraps the { blog } detail envelope", async () => {
    const { cms, fetchFn } = client(async () => json({ blog: BLOG }));

    expect(await cms.getBlog("field-notes")).toEqual(BLOG);
    const [url, init] = callOf(fetchFn);
    expect(url).toBe(`${BASE}/api/v1/cms/blogs/field-notes`);
    expect(init.next?.tags).toEqual(["cms:blogs"]);
  });

  it("refuses a bad slug and rejects a draft-shaped hole in the contract", async () => {
    const { cms, fetchFn } = client(async () => json({ blog: BLOG }));

    expect(await cms.getBlog("a/b")).toBeNull();
    expect(fetchFn).not.toHaveBeenCalled();

    const bad = client(async () => json({ blog: { ...BLOG, status: "scheduled" } }));
    expect(await bad.cms.getBlog("field-notes")).toBeNull();
  });
});

describe("getPage", () => {
  it("unwraps the { page } envelope with the per-slug tag", async () => {
    const { cms, fetchFn } = client(async () => json({ page: PAGE }));

    expect(await cms.getPage("about-us")).toEqual(PAGE);
    const [url, init] = callOf(fetchFn);
    expect(url).toBe(`${BASE}/api/v1/cms/pages/about-us`);
    expect(init.next).toEqual({ tags: ["cms:pages:about-us"], revalidate: 300 });
  });

  it("refuses a bad slug before the request", async () => {
    const { cms, fetchFn } = client(async () => json({ page: PAGE }));

    expect(await cms.getPage("About")).toBeNull();
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("returns null on a non-2xx and on a malformed block", async () => {
    const down = client(async () => json({ error: "nope" }, 503));
    expect(await down.cms.getPage("about-us")).toBeNull();

    const malformed = client(async () =>
      json({ page: { ...PAGE, blocks: [{ type: "video", id: "v1" }] } }),
    );
    expect(await malformed.cms.getPage("about-us")).toBeNull();
  });
});

describe("failure paths — a value, never an exception", () => {
  it("returns null on a non-2xx", async () => {
    const { cms } = client(async () => json({ error: "nope" }, 503));
    expect(await cms.getNavigation()).toBeNull();
  });

  it("returns null when the request times out", async () => {
    const { cms } = client(async () => {
      throw new DOMException("The operation was aborted.", "AbortError");
    });
    expect(await cms.getPageSettings("auth")).toBeNull();
  });

  it.each([
    ["a non-JSON body", async () => new Response("<html>gateway</html>")],
    ["a missing envelope key", async () => json({ version: 1 })],
    ["a string payload", async () => json({ navbar: "nope", version: 1 })],
    ["a non-numeric version", async () => json({ navbar: {}, version: "9" })],
  ])("returns null for %s", async (_label, handler) => {
    const { cms } = client(handler as () => Promise<Response>);
    expect(await cms.getNavigation()).toBeNull();
  });
});

describe("configuration", () => {
  it("defaults to :4050 and trims trailing slashes", () => {
    vi.stubEnv("CMS_BASE_URL", "");
    expect(cmsBaseUrl()).toBe("http://localhost:4050");

    vi.stubEnv("CMS_BASE_URL", "http://cms.internal:8080//");
    expect(cmsBaseUrl()).toBe("http://cms.internal:8080");
  });

  it("budgets 2 s — shorter than the render, longer than cms-svc's p99", () => {
    expect(CMS_TIMEOUT_MS).toBe(2000);
  });
});
