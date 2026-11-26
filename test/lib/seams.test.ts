/** sf-076 resolver tier: zod-validated config and the orders limit seam. */
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

afterEach(() => vi.unstubAllEnvs());

describe("config seams", () => {
  it("accepts a schema-valid theme response and its additive configured flag", async () => {
    const { createCmsClient } = await import("@/lib/cms/client");
    const client = createCmsClient({
      baseUrl: "http://cms.test",
      fetchFn: (async () =>
        new Response(
          JSON.stringify({ theme: { button: {} }, version: 2, configured: false }),
          { status: 200, headers: { "content-type": "application/json" } },
        )) as typeof fetch,
    });
    const read = await client.getGlobalSettings();
    expect(read.status).toBe(200);
    expect((read.data as { configured?: boolean } | null)?.configured).toBe(false);
  });

  it("rejects a wrong-typed theme envelope as CONTRACT_MISMATCH, never a cast", async () => {
    const { createCmsClient } = await import("@/lib/cms/client");
    const client = createCmsClient({
      baseUrl: "http://cms.test",
      fetchFn: (async () =>
        new Response(JSON.stringify({ theme: "not-an-object", version: 2 }), {
          status: 200,
          headers: { "content-type": "application/json" },
        })) as typeof fetch,
    });
    const read = await client.getGlobalSettings();
    expect(read.data).toBeNull();
    expect(read.code).toBe("CONTRACT_MISMATCH");
  });

  it("clamps /api/orders?limit to 1-100 (I-23)", async () => {
    const { GET } = await import("@/app/api/orders/route");
    const client = await import("@/lib/order/client");
    const seen: number[] = [];
    const spy = vi.spyOn(client, "orderClient").mockReturnValue({
      listOrders: async (_h: unknown, opts: { limit: number }) => {
        seen.push(opts.limit);
        return { ok: true, data: { data: [], nextCursor: null, orders: [] } } as never;
      },
    } as never);
    for (const q of ["?limit=1000", "?limit=0", "?limit=oops"]) {
      await GET(
        new NextRequest(`http://localhost/api/orders${q}`, {
          headers: { cookie: "sf_at=token" },
        }),
      );
    }
    expect(seen).toEqual([100, 1, 20]);
    spy.mockRestore();
  });
});
