/**
 * Checkout idempotency — sf-051
 * (plan §9; the guarantee behind G4's "checkout twice with one key → same orderId")
 *
 * order-svc keys its replay cache on `x-idempotency-key`, so the header value —
 * not the body — is what makes "clicked pay twice, charged once" true. That
 * gives one tension a raw `randomUUID()` cannot resolve:
 *
 * - Retrying **the same attempt** (a blip, a 503, an in-progress poll) must send
 *   the **same** key, or the retry is a second order.
 * - Changing what you are buying (a qty edited from the drawer mid-checkout) is
 *   a **different** attempt; replaying the old key would tell order-svc "give me
 *   the order for this body" and return an order for the old basket.
 *
 * So the key is owned by the caller of `nextKey`, which keeps `{key, hash}` for
 * one logical attempt: the key survives retries while the canonical body hash
 * is unchanged, and a changed hash mints a fresh key.
 *
 * The hash is a stable-stringify FNV-1a — a *discriminator*, not a digest: it
 * only answers "is this the same attempt?", so a non-cryptographic 64-bit-strength
 * fold is enough and has no async API to await in a form handler. Keyless first
 * call is `null` on purpose; `bff()` mints per-request keys for everything that
 * is not checkout, and checkout must go through this file so the intent is
 * written down next to the key.
 */

/** The pair carried across one logical attempt's retries. */
export interface IdemPair {
  key: string;
  hash: string;
}

/** JSON with object keys sorted, so field order cannot change the hash. */
export function canonicalBody(body: unknown): string {
  return JSON.stringify(sortDeep(body));
}

function sortDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return Object.fromEntries(entries.map(([k, v]) => [k, sortDeep(v)]));
  }
  return value;
}

/** FNV-1a (64-bit via BigInt) over the canonical string, as hex. */
export function bodyHash(body: unknown): string {
  const bytes = new TextEncoder().encode(canonicalBody(body));
  let hash = 0xcbf29ce484222325n;
  for (const byte of bytes) {
    hash ^= BigInt(byte);
    hash = (hash * 0x100000001b3n) & 0xffffffffffffffffn;
  }
  return hash.toString(16).padStart(16, "0");
}

/**
 * Keep the key across retries of one body; mint a new one when the body moved.
 *
 * `mint` is injected so the island can seed it from `crypto.randomUUID` in the
 * browser and a test can hand it a counter.
 */
export function nextKey(
  current: IdemPair | null,
  body: unknown,
  mint: () => string,
): IdemPair {
  const hash = bodyHash(body);
  if (current !== null && current.hash === hash) return current;
  return { key: mint(), hash };
}
