/**
 * Result vocabulary — the status→kind table and the two readers.
 *
 * This table *is* the retry policy: a page that sees `unavailable` offers a
 * retry link, one that sees `conflict` does not. A wrong row here produces UI
 * that retries forever against a 409, so the mapping is asserted exhaustively.
 */
import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  encodeQuery,
  failure,
  kindForStatus,
  readFailure,
  readSuccess,
} from "@/lib/http/result";

function json(body: unknown, status = 200, statusText = ""): Response {
  return new Response(JSON.stringify(body), {
    status,
    statusText,
    headers: { "content-type": "application/json" },
  });
}

describe("kindForStatus", () => {
  it("maps every status the backends actually emit", () => {
    expect(kindForStatus(0)).toBe("unavailable");
    expect(kindForStatus(400)).toBe("invalid");
    expect(kindForStatus(401)).toBe("unauthorized");
    expect(kindForStatus(402)).toBe("invalid");
    expect(kindForStatus(403)).toBe("forbidden");
    expect(kindForStatus(404)).toBe("not-found");
    expect(kindForStatus(409)).toBe("conflict");
    expect(kindForStatus(422)).toBe("invalid");
    expect(kindForStatus(429)).toBe("rate-limited");
    expect(kindForStatus(500)).toBe("unavailable");
    expect(kindForStatus(502)).toBe("upstream");
    expect(kindForStatus(503)).toBe("unavailable");
  });

  it("keeps 502 terminal and 503 retryable — they are different decisions", () => {
    expect(kindForStatus(502)).not.toBe(kindForStatus(503));
  });
});

describe("readFailure", () => {
  it("parses the service envelope", async () => {
    const result = await readFailure(
      json({ error: { code: "STOCK_INSUFFICIENT", message: "no stock" } }, 409),
    );

    expect(result).toEqual({
      ok: false,
      kind: "conflict",
      status: 409,
      code: "STOCK_INSUFFICIENT",
      message: "no stock",
    });
  });

  it("carries structured error details through untouched (ord-013)", async () => {
    const details = { itemIds: ["p1"], items: [{ productId: "p1", variantId: null }] };
    const result = await readFailure(
      json({ error: { code: "STOCK_INSUFFICIENT", message: "no stock", details } }, 409),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.details).toEqual(details);
  });

  it("survives a body that is not the envelope (proxy HTML, empty 502)", async () => {
    const result = await readFailure(
      new Response("<html>bad gateway</html>", { status: 502, statusText: "Bad Gateway" }),
    );

    expect(result.ok).toBe(false);
    expect(result.kind).toBe("upstream");
    expect(result.code).toBeNull();
    expect(result.message).toBe("Bad Gateway");
  });

  it("falls back to a generated message when there is no status text", async () => {
    const result = await readFailure(new Response(null, { status: 500 }));
    expect(result.message).toBe("service returned 500");
  });
});

describe("readSuccess", () => {
  it("returns the parsed body when the schema matches", async () => {
    const schema = z.object({ id: z.string() });
    const result = await readSuccess(json({ id: "p1", extra: true }), schema);

    expect(result).toEqual({ ok: true, data: { id: "p1" } });
  });

  it("reports CONTRACT_MISMATCH, never a cast, when a field is wrong", async () => {
    const schema = z.object({ price: z.number() });
    const result = await readSuccess(json({ price: "12.00" }), schema);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("CONTRACT_MISMATCH");
    expect(result.kind).toBe("upstream");
    expect(result.message).toContain("price");
  });

  it("treats 204 as success with undefined data", async () => {
    const result = await readSuccess(new Response(null, { status: 204 }));
    expect(result).toEqual({ ok: true, data: undefined });
  });

  it("reports CONTRACT_MISMATCH when a 200 body is not JSON", async () => {
    const result = await readSuccess(new Response("ok", { status: 200 }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("CONTRACT_MISMATCH");
  });
});

describe("encodeQuery", () => {
  it("drops undefined, null and empty members", () => {
    expect(
      encodeQuery({ categoryId: "c1", q: undefined, cursor: null, sort: "" }),
    ).toBe("?categoryId=c1");
  });

  it("encodes numbers and booleans as strings", () => {
    expect(encodeQuery({ limit: 24, featured: true })).toBe("?limit=24&featured=true");
  });

  it("returns an empty string when nothing survives", () => {
    expect(encodeQuery(undefined)).toBe("");
    expect(encodeQuery({})).toBe("");
    expect(encodeQuery({ q: null })).toBe("");
  });
});

describe("failure", () => {
  it("derives kind from the status so callers cannot forget", () => {
    expect(failure(404, null, "gone")).toEqual({
      ok: false,
      kind: "not-found",
      status: 404,
      code: null,
      message: "gone",
    });
  });
});
