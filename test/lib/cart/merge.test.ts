/**
 * The guest-cart merge called from login/register.
 *
 * What matters is the failure policy, not the happy path: every branch here
 * ends with a boolean, none of them throws, and a slow cart-svc is bounded by
 * a budget the caller can see. Sign-in must never fail because a basket could
 * not be moved.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { MERGE_TIMEOUT_MS, mergeGuestCart } from "@/lib/cart/merge";
import type { CartClient } from "@/lib/cart/client";

const GUEST = "guest-1234";

function client(impl: CartClient["merge"]): CartClient {
  return {
    getCart: vi.fn(),
    addItem: vi.fn(),
    updateItem: vi.fn(),
    removeItem: vi.fn(),
    removeItems: vi.fn(),
    clear: vi.fn(),
    merge: impl,
  } as unknown as CartClient;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("mergeGuestCart", () => {
  it("gives up immediately when the shopper had no guest cart", async () => {
    const merge = vi.fn();
    const merged = await mergeGuestCart({
      accessToken: "at_1",
      guestSessionId: null,
      client: client(merge),
    });

    expect(merged).toBe(false);
    expect(merge).not.toHaveBeenCalled();
  });

  it("merges with the new token and the old guest id", async () => {
    const merge = vi.fn(async () => ({ ok: true as const, data: { id: "c1" } }));

    const merged = await mergeGuestCart({
      accessToken: "at_1",
      guestSessionId: GUEST,
      client: client(merge as unknown as CartClient["merge"]),
    });

    expect(merged).toBe(true);
    expect(merge).toHaveBeenCalledTimes(1);
    expect(merge).toHaveBeenCalledWith(
      { authorization: "Bearer at_1", "x-session-id": GUEST },
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("bounds the call with a 1.5 s budget by default", async () => {
    const merge = vi.fn(async () => ({ ok: true as const, data: { id: "c1" } }));
    let timeout: unknown;

    vi.spyOn(AbortSignal, "timeout").mockImplementation(((ms: number) => {
      timeout = ms;
      return new AbortController().signal;
    }) as typeof AbortSignal.timeout);

    await mergeGuestCart({
      accessToken: "at_1",
      guestSessionId: GUEST,
      client: client(merge as unknown as CartClient["merge"]),
    });

    expect(MERGE_TIMEOUT_MS).toBe(1500);
    expect(timeout).toBe(1500);
  });

  it("honours a caller-supplied budget", async () => {
    let timeout: unknown;
    vi.spyOn(AbortSignal, "timeout").mockImplementation(((ms: number) => {
      timeout = ms;
      return new AbortController().signal;
    }) as typeof AbortSignal.timeout);

    await mergeGuestCart({
      accessToken: "at_1",
      guestSessionId: GUEST,
      timeoutMs: 50,
      client: client(async () => ({ ok: true as const, data: { id: "c1" } })),
    });

    expect(timeout).toBe(50);
  });

  it("reports a 503 as unmerged and never throws", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const merged = await mergeGuestCart({
      accessToken: "at_1",
      guestSessionId: GUEST,
      client: client(
        async () =>
          ({
            ok: false,
            kind: "unavailable",
            status: 503,
            code: "CART_UNAVAILABLE",
            message: "cart-svc is down",
          }) as const,
      ),
    });

    expect(merged).toBe(false);
    // reason: a deliberately swallowed failure still has to be observable.
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("[cart] guest merge failed (503 CART_UNAVAILABLE)"),
    );
  });

  it("swallows a thrown client", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const merged = await mergeGuestCart({
      accessToken: "at_1",
      guestSessionId: GUEST,
      client: client(async () => {
        throw new Error("boom");
      }),
    });

    expect(merged).toBe(false);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("guest merge threw: boom"));
  });

  it("reports an unauthenticated merge as unmerged", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});

    const merged = await mergeGuestCart({
      accessToken: "expired",
      guestSessionId: GUEST,
      client: client(
        async () =>
          ({
            ok: false,
            kind: "unauthorized",
            status: 401,
            code: "UNAUTHENTICATED",
            message: null,
          }) as const,
      ),
    });

    expect(merged).toBe(false);
  });
});
