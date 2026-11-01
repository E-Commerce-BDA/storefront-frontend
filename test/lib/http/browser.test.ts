/**
 * Browser transport — the two behaviours that cost money or a session when
 * they regress:
 *
 *   1. the idempotency key is minted once and *reused* on the 401 replay
 *      (a fresh key on replay = a second cart line, or a second order);
 *   2. concurrent 401s share one refresh (two refreshes = auth-svc
 *      `TOKEN_REUSED` = the shopper is logged out).
 *
 * `fetch` is stubbed globally; no network, no jsdom needed.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { bff } from "@/lib/http/browser";

type Init = RequestInit;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function header(init: Init | undefined, name: string): string | undefined {
  return (init?.headers as Record<string, string> | undefined)?.[name];
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("idempotency", () => {
  it("mints a key for mutations", async () => {
    fetchMock.mockResolvedValueOnce(json({ item: { id: "i1" } }, 201));

    await bff("/api/cart/items", { method: "POST", body: { productId: "p1" } });

    expect(header(fetchMock.mock.calls[0][1], "x-idempotency-key")).toMatch(
      /^[0-9a-f-]{36}$/i,
    );
  });

  it("never sends a key on a GET", async () => {
    fetchMock.mockResolvedValueOnce(json({ items: [] }));

    await bff("/api/cart");

    expect(header(fetchMock.mock.calls[0][1], "x-idempotency-key")).toBeUndefined();
  });

  it("reuses the caller's key — checkout keeps one key per canonical body", async () => {
    fetchMock.mockResolvedValueOnce(json({ orderId: "o1" }, 201));

    await bff("/api/checkout", { method: "POST", body: {}, idempotencyKey: "body-hash-1" });

    expect(header(fetchMock.mock.calls[0][1], "x-idempotency-key")).toBe("body-hash-1");
  });

  it("reuses the SAME key on the 401 replay — a new key would double-add", async () => {
    fetchMock
      .mockResolvedValueOnce(json({ error: { code: "UNAUTHENTICATED" } }, 401))
      .mockResolvedValueOnce(json({ ok: true }))
      .mockResolvedValueOnce(json({ item: { id: "i1" } }, 201));

    const result = await bff("/api/cart/items", {
      method: "POST",
      body: { productId: "p1" },
    });

    expect(result.ok).toBe(true);
    const first = header(fetchMock.mock.calls[0][1], "x-idempotency-key");
    const replay = header(fetchMock.mock.calls[2][1], "x-idempotency-key");
    expect(replay).toBe(first);
    expect(fetchMock.mock.calls[1][0]).toBe("/api/auth/refresh");
  });
});

describe("401 handling", () => {
  it("replays exactly once after a successful refresh", async () => {
    fetchMock
      .mockResolvedValueOnce(json({ error: { code: "UNAUTHENTICATED" } }, 401))
      .mockResolvedValueOnce(json({ ok: true }))
      .mockResolvedValueOnce(json({ items: [] }));

    const result = await bff("/api/cart");

    expect(result).toEqual({ ok: true, data: { items: [] } });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("surfaces the original 401 when the refresh fails", async () => {
    fetchMock
      .mockResolvedValueOnce(json({ error: { code: "UNAUTHENTICATED" } }, 401))
      .mockResolvedValueOnce(new Response(null, { status: 401 }));

    const result = await bff("/api/cart");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.kind).toBe("unauthorized");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("gives up after one replay — a second 401 means the session is gone", async () => {
    fetchMock
      .mockResolvedValueOnce(json({ error: { code: "UNAUTHENTICATED" } }, 401))
      .mockResolvedValueOnce(json({ ok: true }))
      .mockResolvedValueOnce(json({ error: { code: "UNAUTHENTICATED" } }, 401));

    const result = await bff("/api/cart");

    expect(result.ok).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("shares one refresh across concurrent 401s (TOKEN_REUSED defence)", async () => {
    let release: (value: Response) => void = () => {};
    const gate = new Promise<Response>((resolve) => {
      release = resolve;
    });

    fetchMock.mockImplementation(async (url: string) => {
      if (url === "/api/auth/refresh") return gate;
      const isFirstRound = fetchMock.mock.calls.filter((c) => c[0] !== "/api/auth/refresh").length <= 2;
      if (isFirstRound) return json({ error: { code: "UNAUTHENTICATED" } }, 401);
      return json({ items: [] });
    });

    const both = Promise.all([bff("/api/cart"), bff("/api/cart")]);
    // A macrotask hop drains every pending microtask, so both 401s have landed
    // and are parked on the shared refresh before the gate opens.
    await new Promise((resolve) => setTimeout(resolve, 0));
    release(json({ ok: true }));
    const [a, b] = await both;

    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true);
    const refreshes = fetchMock.mock.calls.filter((c) => c[0] === "/api/auth/refresh");
    expect(refreshes).toHaveLength(1);
  });
});

describe("body handling", () => {
  it("validates the success body when a schema is given", async () => {
    fetchMock.mockResolvedValueOnce(json({ count: "two" }));

    const result = await bff("/api/cart", { schema: z.object({ count: z.number() }) });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("CONTRACT_MISMATCH");
  });

  it("reports a network failure as unavailable instead of throwing", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    const result = await bff("/api/cart");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.kind).toBe("unavailable");
    expect(result.status).toBe(0);
  });

  it("marks an aborted request ABORTED so callers stay silent", async () => {
    const aborted = new Error("aborted");
    aborted.name = "AbortError";
    fetchMock.mockRejectedValueOnce(aborted);

    const result = await bff("/api/cart", { signal: new AbortController().signal });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("ABORTED");
  });

  it("sends cookies on every request — the session is HttpOnly", async () => {
    fetchMock.mockResolvedValueOnce(json({ items: [] }));

    await bff("/api/cart");

    expect(fetchMock.mock.calls[0][1]).toMatchObject({ credentials: "same-origin" });
  });
});
