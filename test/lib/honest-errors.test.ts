/** sf-075 resolver-unit tier: the failure envelope and honest error faces. */
import { describe, expect, it } from "vitest";
import { failure, readFailure, readRetryAfter } from "@/lib/http/result";
import { createReviewSchema } from "@/lib/reviews/schemas";

function json(body: unknown, status: number, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers });
}

describe("failure envelope", () => {
  it("carries code, message, details and retryAfter through one shape", async () => {
    const result = await readFailure(
      json(
        {
          error: {
            code: "RATE_LIMITED",
            message: "Slow down",
            details: { scope: "checkout" },
            retryAfter: 12,
          },
        },
        429,
      ),
    );
    expect(result).toMatchObject({
      kind: "rate-limited",
      status: 429,
      code: "RATE_LIMITED",
      message: "Slow down",
      details: { scope: "checkout" },
      retryAfter: 12,
    });
  });

  it("honours Retry-After from the header and ignores an empty one", () => {
    expect(readRetryAfter("15")).toBe(15);
    expect(readRetryAfter("")).toBeUndefined();
    expect(readRetryAfter(null)).toBeUndefined();
    expect(failure(503, null, null, undefined, 3).retryAfter).toBe(3);
  });
});

describe("review contract (catalog-svc 303628b)", () => {
  it("rejects the old orderId payload and the old 255/4000 limits", () => {
    expect(
      createReviewSchema.safeParse({
        orderId: "o1",
        productId: "p1",
        rating: 5,
        body: "ok",
      }).success,
    ).toBe(false);
    expect(
      createReviewSchema.safeParse({
        productId: "p1",
        rating: 5,
        title: "x".repeat(121),
        body: "ok",
      }).success,
    ).toBe(false);
    expect(
      createReviewSchema.safeParse({
        productId: "p1",
        rating: 5,
        body: "x".repeat(2001),
      }).success,
    ).toBe(false);
  });

  it("accepts the documented 201 shape", () => {
    const parsed = createReviewSchema.safeParse({
      productId: "p1",
      rating: 5,
      title: "Great",
      body: "Really good.",
    });
    expect(parsed.success).toBe(true);
  });
});
