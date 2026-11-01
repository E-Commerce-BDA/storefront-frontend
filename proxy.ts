/**
 * Storefront proxy — sf-049, extended by sf-051
 * (Next 16 renamed `middleware.ts` to `proxy.ts`; the default export still
 * runs per matched request.)
 *
 * Three jobs now:
 *
 * 1. `GET /api/auth/session` — the one place a token leaves this origin, and
 *    it leaves as a header, server-to-server. The handler rewrites to auth-svc
 *    `/me`, injects `Authorization: Bearer $sf_at`, and **strips the inbound
 *    `Cookie` header** so the browser's credentials are not forwarded to a
 *    service that never asked for them. The response is auth-svc's own
 *    `{ user }` — no token can appear in it, because `/me` does not return one.
 *
 * 2. `/account/*`, `/checkout/*` — a navigation guard, not an authorisation
 *    check. Edges are enforced by the API; this only stops a signed-out
 *    shopper from landing on an empty shell. Hence: no access cookie but a
 *    refresh cookie → bounce through `/api/auth/refresh` (which either mints
 *    a pair or clears both); no cookies at all → `/signin?next=…`.
 *
 * 3. Guest cart identity (`sf_cid`, sf-051) — minted here, for every page the
 *    shopper can add to a cart from, **before the first render**.
 *
 * WHY mint here rather than on the first cart write: two quick "add" taps would
 * both see no cookie, each would mint its own id, each would create its own
 * cart — and one of them is orphaned with an item the shopper paid attention
 * to. One id per browser, decided before anything can race. The BFF keeps a
 * mint-on-first-write fallback for the case where this build stops propagating
 * the request-cookie mutation: then a render sees an empty cart once, but no
 * add is ever lost.
 *
 * WHY the proxy does not check `/api/cart` or any other API route: every one
 * of them already answers 401 on its own, and a matcher that wide would add a
 * hop to every request the storefront makes.
 */

import { NextResponse, type NextRequest } from "next/server";
import { authServiceUrl } from "@/lib/auth/client";
import { safeNextPath } from "@/lib/auth/next";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  isSecureCookie,
  readCookie,
  type CookieSpec,
} from "@/lib/auth/session";
import { GUEST_COOKIE, guestCookie, mintGuestId } from "@/lib/session/guest";

const SESSION_PATH = "/api/auth/session";
const REFRESH_ROUTE = "/api/auth/refresh";
const SIGNIN_PATH = "/signin";

/** Only the routes this file knows how to handle, whatever the matcher says. */
const GUARDED_RE = /^\/(account|checkout)(\/|$)/;

export const config = {
  // Literals, not `SESSION_PATH`: the matcher is parsed at compile time, so a
  // const reference is rejected by the Turbopack build ("need to be static
  // strings"). The constant above stays for the runtime branch.
  //
  // `/`, `/products/:path*` and `/cart` are here for the guest cookie only —
  // they are every route a shopper can add to a cart from.
  matcher: [
    "/",
    "/api/auth/session",
    "/products/:path*",
    "/cart",
    "/account/:path*",
    "/checkout/:path*",
  ],
};

export default function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  if (pathname === SESSION_PATH) return forwardSession(request);

  // Mint **before** the response exists: `NextResponse.next()` snapshots the
  // request headers it is handed, so a cookie set afterwards would reach the
  // browser but not this render.
  const minted = ensureGuest(request);

  const response = GUARDED_RE.test(pathname) ? guard(request) : null;
  const result = response ?? NextResponse.next({ request: { headers: request.headers } });

  if (minted !== null) result.cookies.set(minted);
  return result;
}

/**
 * Put `sf_cid` on the request when the browser has none. Returns the cookie the
 * response has to carry (or null when nothing was minted).
 */
function ensureGuest(request: NextRequest): CookieSpec | null {
  if (readCookie(request.cookies, GUEST_COOKIE) !== null) return null;

  const id = mintGuestId();
  // Request side: this render can already read the id (RSC and handlers).
  request.cookies.set(GUEST_COOKIE, id);
  // Response side: the browser keeps it for 30 days.
  return guestCookie(id, { secure: isSecureCookie() });
}

/** Null means "allowed through"; a value is the redirect to send instead. */
function guard(request: NextRequest): NextResponse | null {
  if (readCookie(request.cookies, ACCESS_COOKIE) !== null) return null;

  // `pathname + search` is what the shopper actually asked for; `safeNextPath`
  // is what makes it safe to echo back into a redirect.
  const resume = safeNextPath(`${request.nextUrl.pathname}${request.nextUrl.search}`);

  const url = request.nextUrl.clone();
  url.search = "";

  if (readCookie(request.cookies, REFRESH_COOKIE) !== null) {
    url.pathname = REFRESH_ROUTE;
    url.searchParams.set("next", resume);
    return NextResponse.redirect(url);
  }

  url.pathname = SIGNIN_PATH;
  url.searchParams.set("next", resume);
  return NextResponse.redirect(url);
}

function forwardSession(request: NextRequest): NextResponse {
  const accessToken = readCookie(request.cookies, ACCESS_COOKIE);
  if (accessToken === null) {
    return NextResponse.json(
      { error: { code: "UNAUTHENTICATED" } },
      { status: 401 },
    );
  }

  const headers = new Headers(request.headers);
  headers.set("authorization", `Bearer ${accessToken}`);
  headers.delete("cookie");

  return NextResponse.rewrite(new URL(`${authServiceUrl()}/api/v1/auth/me`), {
    request: { headers },
  });
}
