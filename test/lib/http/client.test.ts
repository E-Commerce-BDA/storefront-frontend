/**
 * Server transport — URL assembly, headers, cache options, and the two
 * promises every domain client relies on: it never throws, and it never
 * returns a body that failed its schema.
 *
 * No network: `fetchFn` is injected, which is the same seam the real clients
 * use in their own tests.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createServiceClient } from "@/lib/http/client";

type Init = RequestInit & { next?: { revalidate: number } };

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function client(handler: () => Promise<Response>, timeoutMs = 1234) {
  const fetchFn = vi.fn(handler);
  const perform = createServiceClient("cart", {
    baseUrl: "http://cart.test/",
    fetchFn: fetchFn as unknown as typeof fetch,
    timeoutMs,
  });
  return { fetchFn, perform };
}

function callOf(fetchFn: ReturnType<typeof client>["fetchFn"]): [string, Init] {
  return fetchFn.mock.calls[0] as unknown as [string, Init];
}

function callAt(fetchFn: ReturnType<typeof client>["fetchFn"], index: number): [string, Init] {
  return fetchFn.mock.calls[index] as unknown as [string, Init];
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("request assembly", () => {
  it("joins base and path without a double slash", async () => {
    const { perform, fetchFn } = client(async () => json({ ok: true }));

    await perform({ path: "/api/v1/cart" });

    expect(callOf(fetchFn)[0]).toBe("http://cart.test/api/v1/cart");
  });

  it("appends only the query members that exist", async () => {
    const { perform, fetchFn } = client(async () => json({ ok: true }));

    await perform({
      path: "/api/v1/catalog/products",
      query: { status: "active", cursor: null, limit: 24, q: "" },
    });

    expect(callOf(fetchFn)[0]).toBe(
      "http://cart.test/api/v1/catalog/products?status=active&limit=24",
    );
  });

  it("defaults to GET, sends json only when a body exists", async () => {
    const { perform, fetchFn } = client(async () => json({ ok: true }));

    await perform({ path: "/api/v1/cart" });
    const [url, init] = callOf(fetchFn);
    expect(url).toBe("http://cart.test/api/v1/cart");
    expect(init.method).toBe("GET");
    expect(init.body).toBeUndefined();
    expect((init.headers as Record<string, string>)["content-type"]).toBeUndefined();
    expect((init.headers as Record<string, string>).accept).toBe("application/json");
  });

  it("serialises a body and declares content-type", async () => {
    const { perform, fetchFn } = client(async () => json({ ok: true }, 201));

    await perform({
      method: "POST",
      path: "/api/v1/cart/items",
      body: { productId: "p1", qty: 2 },
      headers: { "x-idempotency-key": "k1" },
    });

    const [, init] = callOf(fetchFn);
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ productId: "p1", qty: 2 }));
    expect(init.headers).toMatchObject({
      "content-type": "application/json",
      "x-idempotency-key": "k1",
    });
  });

  it("maps cache options onto next.revalidate or cache:no-store", async () => {
    const { perform, fetchFn } = client(async () => json({ ok: true }));

    await perform({ path: "/a", cache: { revalidate: 60 } });
    await perform({ path: "/b", cache: "no-store" });

    expect(callAt(fetchFn, 0)[1]).toMatchObject({ next: { revalidate: 60 } });
    expect(callAt(fetchFn, 1)[1]).toMatchObject({ cache: "no-store" });
  });

  it("forwards cache tags alongside revalidate (sf-061)", async () => {
    const { perform, fetchFn } = client(async () => json({ ok: true }));

    await perform({ path: "/a", cache: { revalidate: 60, tags: ["catalog:products"] } });

    expect(callOf(fetchFn)[1]).toMatchObject({
      next: { revalidate: 60, tags: ["catalog:products"] },
    });
  });

  it("always carries an abort signal, even without a caller one", async () => {
    const { perform, fetchFn } = client(async () => json({ ok: true }));

    await perform({ path: "/a" });

    expect(callOf(fetchFn)[1].signal).toBeInstanceOf(AbortSignal);
  });
});

describe("failures are values, never exceptions", () => {
  it("reports a network failure as unavailable with status 0", async () => {
    const { perform } = client(async () => {
      throw new TypeError("fetch failed");
    });

    const result = await perform({ path: "/api/v1/cart" });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.kind).toBe("unavailable");
    expect(result.status).toBe(0);
    expect(result.code).toBe("NETWORK_ERROR");
  });

  it("names a timeout TIMEOUT so the page can say why", async () => {
    const { perform } = client(async () => {
      const error = new Error("aborted");
      error.name = "TimeoutError";
      throw error;
    });

    const result = await perform({ path: "/api/v1/cart" });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("TIMEOUT");
    expect(result.message).toContain("1234 ms");
    expect(result.kind).toBe("unavailable");
  });

  it("passes an upstream domain code straight through", async () => {
    const { perform } = client(async () =>
      json({ error: { code: "CART_PRODUCT_UNAVAILABLE", message: "gone" } }, 422),
    );

    const result = await perform({ path: "/api/v1/cart/items", method: "POST", body: {} });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result).toMatchObject({
      kind: "invalid",
      status: 422,
      code: "CART_PRODUCT_UNAVAILABLE",
      message: "gone",
    });
  });

  it("fails the call instead of the page when a schema mismatches", async () => {
    const { perform } = client(async () => json({ items: "not-an-array" }));

    const result = await perform({
      path: "/api/v1/cart",
      schema: z.object({ items: z.array(z.unknown()) }),
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("CONTRACT_MISMATCH");
    expect(result.kind).toBe("upstream");
  });
});

describe("success path", () => {
  it("validates and returns typed data", async () => {
    const { perform } = client(async () => json({ itemCount: 3 }));

    const result = await perform({
      path: "/api/v1/cart",
      schema: z.object({ itemCount: z.number() }),
    });

    expect(result).toEqual({ ok: true, data: { itemCount: 3 } });
  });

  it("returns undefined data for a 204 DELETE", async () => {
    const { perform } = client(async () => new Response(null, { status: 204 }));

    const result = await perform({ path: "/api/v1/cart/items/i1", method: "DELETE" });

    expect(result).toEqual({ ok: true, data: undefined });
  });

  it("returns the raw body when no schema is given", async () => {
    const { perform } = client(async () => json({ anything: [1, 2] }));

    const result = await perform({ path: "/x" });

    expect(result).toEqual({ ok: true, data: { anything: [1, 2] } });
  });
});

describe("registry wiring", () => {
  it("uses the registry base URL and timeout when no override is given", async () => {
    vi.stubEnv("CART_SVC_URL", "http://cart.env:9999/");
    const fetchFn = vi.fn(async () => json({ ok: true }));

    const perform = createServiceClient("cart", {
      fetchFn: fetchFn as unknown as typeof fetch,
    });
    await perform({ path: "/api/v1/cart" });

    expect(callOf(fetchFn)[0]).toBe("http://cart.env:9999/api/v1/cart");
  });
});
