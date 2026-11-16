import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET as suggestGET } from "@/app/api/search/suggest/route";

function stubFetch(status: number, body: unknown) {
  const fetchFn = vi.fn(async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    }),
  );
  vi.stubGlobal("fetch", fetchFn);
  return fetchFn;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("GET /api/search/suggest", () => {
  it("returns empty suggestions for short query (< 2 chars)", async () => {
    vi.stubEnv("SEARCH_SVC_URL", "http://search.test");
    const fetchFn = stubFetch(200, {});

    const req = new NextRequest("http://localhost/api/search/suggest?q=a");
    const res = await suggestGET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.products).toEqual([]);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("forwards query and limit to search-svc", async () => {
    vi.stubEnv("SEARCH_SVC_URL", "http://search.test");
    const fetchFn = stubFetch(200, {
      query: "linen",
      categories: [],
      products: [
        {
          id: "p1",
          slug: "linen-shirt",
          name: "Linen Shirt",
          price: 48,
          effectivePrice: 48,
        },
      ],
      blogs: [],
    });

    const req = new NextRequest("http://localhost/api/search/suggest?q=linen&limit=5");
    const res = await suggestGET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.products).toHaveLength(1);
    expect(body.products[0].slug).toBe("linen-shirt");
    expect(fetchFn).toHaveBeenCalled();
  });

  it("returns 503 error when search-svc is unavailable", async () => {
    vi.stubEnv("SEARCH_SVC_URL", "http://search.test");
    stubFetch(503, {
      error: { code: "SERVICE_UNAVAILABLE", message: "search down" },
    });

    const req = new NextRequest("http://localhost/api/search/suggest?q=linen");
    const res = await suggestGET(req);

    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });
});
