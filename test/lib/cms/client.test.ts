/**
 * CMS client — URLs, cache tags, and the "null, never throw" contract.
 *
 * The tag assertion is the important one: without `next.tags` the fetch still
 * renders, so nothing breaks visibly — `POST /api/revalidate` just stops
 * working. That is exactly the kind of regression a test has to catch.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
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
