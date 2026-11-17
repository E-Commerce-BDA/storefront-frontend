import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/catalog/products/route";

const harness = vi.hoisted(() => ({ load: vi.fn() }));

vi.mock("@/lib/catalog/listingPage", () => ({
  loadListingPage: harness.load,
  searchParamsToRecord: (sp: URLSearchParams) =>
    Object.fromEntries(sp.entries()),
}));

afterEach(() => harness.load.mockReset());

describe("GET /api/catalog/products", () => {
  it("returns mapped items and the next cursor", async () => {
    harness.load.mockResolvedValue({
      ok: true,
      data: {
        items: [{ id: "p1" }],
        nextCursor: "cursor-2",
      },
    });
    const res = await GET(
      new NextRequest("http://localhost/api/catalog/products?sort=price_asc&cursor=cursor-1"),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ items: [{ id: "p1" }], nextCursor: "cursor-2" });
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("maps an unavailable catalog to 503 and a dead filter to 404", async () => {
    harness.load.mockResolvedValueOnce({
      ok: false,
      kind: "unavailable",
      scope: "products",
      retry: "/products",
    });
    const down = await GET(new NextRequest("http://localhost/api/catalog/products"));
    expect(down.status).toBe(503);

    harness.load.mockResolvedValueOnce({
      ok: false,
      kind: "not-found",
      scope: "brand",
      slug: "ghost",
      retry: "/products",
    });
    const missing = await GET(new NextRequest("http://localhost/api/catalog/products?brand=ghost"));
    expect(missing.status).toBe(404);
  });
});
