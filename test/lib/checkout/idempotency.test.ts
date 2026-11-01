/**
 * Checkout idempotency — model tier (plan §12: "key reuse").
 *
 * The one behaviour money depends on: a retry of the *same attempt* must reuse
 * the key (order-svc's replay cache is keyed on it), while a *changed body*
 * must not — replaying the old key for a new basket would return an order for
 * the old one. Everything else here exists to serve those two sentences.
 */
import { describe, expect, it, beforeEach } from "vitest";
import { bodyHash, canonicalBody, nextKey, type IdemPair } from "@/lib/checkout/idempotency";

let minted = 0;
const mint = () => `k${(minted += 1)}`;

beforeEach(() => {
  minted = 0;
});

const attempt = { items: [{ productId: "p1", qty: 2 }], shippingAddress: { city: "Berlin" } };

describe("canonicalBody", () => {
  it("sorts object keys so field order cannot change the string", () => {
    expect(canonicalBody({ b: 1, a: { d: 4, c: 3 } })).toBe('{"a":{"c":3,"d":4},"b":1}');
  });

  it("treats an absent key and an undefined value as the same body", () => {
    expect(canonicalBody({ a: 1, notes: undefined })).toBe(canonicalBody({ a: 1 }));
  });

  it("keeps array order — items in a different order are a different basket", () => {
    expect(canonicalBody([1, 2])).not.toBe(canonicalBody([2, 1]));
  });
});

describe("bodyHash", () => {
  it("is stable across key order and different across content", () => {
    expect(bodyHash({ x: 1, y: 2 })).toBe(bodyHash({ y: 2, x: 1 }));
    expect(bodyHash({ x: 1, y: 2 })).not.toBe(bodyHash({ x: 1, y: 3 }));
  });
});

describe("nextKey", () => {
  it("mints on the first submit", () => {
    const pair = nextKey(null, attempt, mint);
    expect(pair.key).toBe("k1");
    expect(pair.hash).toBe(bodyHash(attempt));
  });

  it("keeps the key across retries of the same body, even reordered", () => {
    const first = nextKey(null, attempt, mint);
    const reordered = { shippingAddress: { city: "Berlin" }, items: [{ qty: 2, productId: "p1" }] };
    expect(nextKey(first, reordered, mint)).toBe(first);
  });

  it("mints a fresh key when the body moves (qty edited mid-checkout)", () => {
    const first = nextKey(null, attempt, mint);
    const changed = { ...attempt, items: [{ productId: "p1", qty: 3 }] };
    const second = nextKey(first, changed, mint);
    expect(second.key).not.toBe(first.key);
    expect(second.hash).toBe(bodyHash(changed));
  });

  it("a rotated pair (null) starts a new attempt even on the same body", () => {
    const first: IdemPair = { key: "old", hash: bodyHash(attempt) };
    const fresh = nextKey(null, attempt, mint);
    expect(fresh.key).not.toBe(first.key);
  });
});
