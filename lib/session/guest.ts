/**
 * Guest cart identity — sf-051
 * (A4.6 guest cart via `sf_cid`, merge on sign-in)
 *
 * A shopper who has not signed in still needs a cart, and cart-svc identifies
 * one by `x-session-id` (`SESSION_ID_PATTERN = /^[A-Za-z0-9._~-]{8,64}$/`). So
 * the storefront keeps one long-lived guest id in an HttpOnly cookie and sends
 * it as that header.
 *
 * Three decisions:
 *
 * - **HttpOnly.** JavaScript never needs this value; keeping it out of JS means
 *   an XSS cannot steal a basket. The BFF reads it from the request and the
 *   island never sees it.
 * - **Minted in `proxy.ts`, not on first write.** Two quick "add" taps would
 *   otherwise race: each would mint its own id, each would create its own cart,
 *   and one of them would be silently orphaned. One id per browser, decided
 *   before the first render.
 * - **Rotated after a successful merge.** Reusing the converted id would leave
 *   a signed-in cart attached to `sf_cid` — the next sign-out would resurrect
 *   the old basket, which is exactly what A4.6 says must not happen.
 *
 * Pure module: no `next/headers`, no request object, so the attributes are
 * assertable in a node test (the `lib/auth/session.ts` precedent).
 */

import type { CookieSpec } from "@/lib/auth/session";

export const GUEST_COOKIE = "sf_cid";
/** 30 days — long enough that a browser keeps its basket between visits. */
export const GUEST_TTL_SECONDS = 30 * 24 * 60 * 60;

/** Mirrors cart-svc's `CartIdentityGuard` pattern. Same regex, one meaning. */
export const GUEST_ID_PATTERN = /^[A-Za-z0-9._~-]{8,64}$/;

/** A UUID satisfies the guard pattern; `crypto.randomUUID` exists on the edge. */
export function mintGuestId(): string {
  return crypto.randomUUID();
}

export function isGuestId(value: unknown): value is string {
  return typeof value === "string" && GUEST_ID_PATTERN.test(value);
}

/**
 * The cookie spec for a guest id. `maxAge: 0` clears it — used right after a
 * merge rotates away from the converted id.
 */
export function guestCookie(id: string, options: { secure: boolean }): CookieSpec {
  return {
    name: GUEST_COOKIE,
    value: id,
    httpOnly: true,
    secure: options.secure,
    sameSite: "lax",
    path: "/",
    maxAge: id.length > 0 ? GUEST_TTL_SECONDS : 0,
  };
}
