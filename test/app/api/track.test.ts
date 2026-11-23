import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { z } from "zod";

const harness = vi.hoisted(() => ({ track: vi.fn(async () => ({ ok: true })) }));

vi.mock("@/lib/analytics/client", () => ({
  trackBeaconSchema: z
    .object({
      page: z.string().min(1),
      eventKind: z.enum(["pageview", "heartbeat"]),
    })
    .strict(),
  analyticsClient: () => ({ track: harness.track }),
}));

const { POST } = await import("@/app/api/track/route");

function request(body: unknown = { page: "/home", eventKind: "pageview" }) {
  return new NextRequest("http://localhost/api/track", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

afterEach(() => harness.track.mockClear());

describe("POST /api/track", () => {
  it("forwards the beacon with a session id and returns 202", async () => {
    const res = await POST(request());
    expect(res.status).toBe(202);
    expect(await res.json()).toEqual({ status: "accepted" });
    expect(harness.track).toHaveBeenCalledOnce();
    const calls = harness.track.mock.calls as unknown as Array<[Record<string, unknown>]>;
    expect(calls[0][0]).toMatchObject({
      page: "/home",
      eventKind: "pageview",
    });
    expect(calls[0][0].sessionId).toMatch(/^[A-Za-z0-9._~-]{8,64}$/);
  });

  it("returns 202 even when analytics is down", async () => {
    harness.track.mockResolvedValueOnce({ ok: false });
    const res = await POST(request());
    expect(res.status).toBe(202);
  });

  it("rejects a malformed beacon with 400 and does not forward", async () => {
    const res = await POST(request({ page: "" }));
    expect(res.status).toBe(400);
    expect(harness.track).not.toHaveBeenCalled();
  });

  it("does not forward or mint a cookie when the shopper opted out", async () => {
    const req = request();
    req.cookies.set("sf_track_optout", "1");
    const res = await POST(req);
    expect(res.status).toBe(202);
    expect(harness.track).not.toHaveBeenCalled();
    expect(res.cookies.get("sf_cid")).toBeUndefined();
  });
});
