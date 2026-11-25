/**
 * sf-066 BFF: validate before forwarding, keep the service key server-side,
 * and forward upstream error codes unchanged.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const search = vi.hoisted(() => ({ trending: vi.fn() }));
vi.mock("@/lib/search/client", () => ({ searchClient: () => search }));

const { GET } = await import("@/app/api/search/trending/route");

const OK = {
  terms: ["Linen"],
  items: [{ id: "p1", type: "product", title: "Shirt", slug: "shirt", price: 10 }],
  generatedAt: "2026-11-25T00:00:00Z",
};

function request(query = ""): NextRequest {
  return new NextRequest(`http://localhost/api/search/trending${query}`);
}

beforeEach(() => {
  search.trending.mockReset();
  search.trending.mockResolvedValue({ ok: true, data: OK });
});

describe("GET /api/search/trending", () => {
  it("defaults the limit to 8 and returns the contract body", async () => {
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(search.trending).toHaveBeenCalledWith(8);
    expect(await response.json()).toEqual(OK);
  });

  it("accepts a valid limit and rejects unknown params or out-of-range values", async () => {
    expect((await GET(request("?limit=20"))).status).toBe(200);
    expect(search.trending).toHaveBeenLastCalledWith(20);
    expect((await GET(request("?cursor=abc"))).status).toBe(400);
    expect((await GET(request("?limit=21"))).status).toBe(400);
    expect((await GET(request("?limit=0"))).status).toBe(400);
    expect((await GET(request("?limit=abc"))).status).toBe(400);
    expect(search.trending).toHaveBeenCalledTimes(1);
  });

  it("forwards a service error code without leaking the key", async () => {
    search.trending.mockResolvedValueOnce({
      ok: false,
      kind: "unauthorized",
      status: 401,
      code: "SERVICE_KEY_INVALID",
      message: "bad key",
    });
    const response = await GET(request());
    expect(response.status).toBe(401);
    expect(await response.text()).not.toContain("INTERNAL_SERVICE_KEY");
  });
});
