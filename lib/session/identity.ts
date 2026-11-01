/**
 * Request identity — sf-051
 * (1.Architecture.md §6.7)
 *
 * One reader for "who is asking", used by every BFF handler:
 *
 *   signed in → Bearer access token (cart-svc's guard prefers it)
 *   guest     → `x-session-id` guest cart id from `sf_cid`
 *   neither   → empty headers; the handler decides (an empty cart is a 200)
 *
 * **It takes the request object, never `next/headers`.** That single rule is
 * what makes every handler testable with a plain `NextRequest` — no framework
 * mocking, no implicit request scope — and it is why a server component can
 * never accidentally read a cookie while streaming.
 *
 * It reports `sessionId` separately from the headers because login/register
 * need the *value* to merge the guest cart, while the clients only need the
 * header.
 */

import {
  ACCESS_COOKIE,
  isSecureCookie,
  readCookie,
  type CookieReader,
  type CookieSpec,
} from "@/lib/auth/session";
import { GUEST_COOKIE, guestCookie, isGuestId, mintGuestId } from "@/lib/session/guest";
import type { IdentityHeaders } from "@/lib/cart/client";

export interface Identity {
  /** null for a guest. */
  userId: string | null;
  accessToken: string | null;
  /** The guest cart id, only when it passes cart-svc's pattern. */
  sessionId: string | null;
}

/**
 * Read identity from a request's cookies.
 *
 * A malformed `sf_cid` is treated as absent rather than forwarded: cart-svc
 * would answer 400 `VALIDATION_FAILED` on every cart call, and the shopper
 * would see a permanently broken cart they cannot fix from the UI.
 */
export function readIdentity(cookies: CookieReader): Identity {
  const accessToken = readCookie(cookies, ACCESS_COOKIE);
  const rawGuest = readCookie(cookies, GUEST_COOKIE);
  const sessionId = isGuestId(rawGuest) ? rawGuest : null;

  // A signed-in shopper is identified by the token; the user id is not in the
  // cookie (it is not a JWT claim we can read here) and nothing downstream
  // needs it — handlers that do ask `/auth/me`.
  return { userId: null, accessToken, sessionId };
}

/** True when the request carries anything a service would accept. */
export function hasIdentity(identity: Identity): boolean {
  return identity.accessToken !== null || identity.sessionId !== null;
}

/**
 * The headers a service expects. Bearer first: cart-svc's guard checks it
 * before `x-session-id`, so a signed-in shopper's guest id (still present until
 * the next rotation) can never win.
 */
export function identityHeaders(identity: Identity): IdentityHeaders {
  const headers: IdentityHeaders = {};
  if (identity.accessToken !== null) headers.authorization = `Bearer ${identity.accessToken}`;
  if (identity.sessionId !== null) headers["x-session-id"] = identity.sessionId;
  return headers;
}

/**
 * Identity for a **write**, with the proxy's failure mode covered.
 *
 * `sf_cid` is normally minted in the proxy before the first render. If a build
 * ever stops propagating that request-cookie mutation, a cart write would
 * arrive with no identity at all and cart-svc would answer 401 — the shopper
 * would lose the item they just added. So a write mints on the spot and the
 * handler puts the cookie on its own response: the item lands in a cart the
 * browser will keep sending, and at worst the *previous* render showed empty.
 *
 * Read-only handlers must not use this — a GET should never create state.
 */
export function identityForWrite(cookies: CookieReader): {
  identity: Identity;
  minted: CookieSpec | null;
} {
  const identity = readIdentity(cookies);
  if (identity.sessionId !== null || identity.accessToken !== null) {
    return { identity, minted: null };
  }

  const id = mintGuestId();
  return {
    identity: { ...identity, sessionId: id },
    minted: guestCookie(id, { secure: isSecureCookie() }),
  };
}
