import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const reviews = vi.hoisted(() => ({ create: vi.fn(async () => ({ ok: true, data: { id: "r1" } })) }));
vi.mock("@/lib/reviews/client", () => ({ reviewClient: () => reviews }));

const { POST } = await import("@/app/api/reviews/route");

function request(body: unknown, cookie = "sf_at=at_1"): NextRequest {
  return new NextRequest("http://localhost/api/reviews", {
    method: "POST",
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body),
  });
}

// catalog-svc 303628b requires a body and strips undeclared keys (orderId).
const VALID = { productId: "p1", rating: 5, title: "Great", body: "Really good." };

beforeEach(() => {
  reviews.create.mockClear();
});

describe("POST /api/reviews (sf-059)", () => {
  it("queues a valid review for moderation through the catalog seam", async () => {
    const response = await POST(request(VALID));
    expect(response.status).toBe(201);
    expect(reviews.create).toHaveBeenCalledWith(
      expect.objectContaining({ authorization: "Bearer at_1" }),
      VALID,
    );
  });

  it("rejects a guest and an out-of-range rating before forwarding", async () => {
    expect((await POST(request(VALID, ""))).status).toBe(401);
    expect((await POST(request({ ...VALID, rating: 9 }))).status).toBe(400);
    expect(reviews.create).not.toHaveBeenCalled();
  });
});
