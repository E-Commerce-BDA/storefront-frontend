/**
 * Storefront proxy — sf-049
 * (Next 16 renamed `middleware.ts` to `proxy.ts`; the default export still
 * runs per matched request.)
 *
 * Two jobs, both about the access cookie:
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
 * WHY the proxy does not check `/api/cart` or any other API route: every one
 * of them already answers 401 on its own, and a matcher that wide would add a
 * hop to every request the storefront makes.
 */

import { NextResponse, type NextRequest } from "next/server";
import { authServiceUrl } from "@/lib/auth/client";
import { safeNextPath } from "@/lib/auth/next";
import { ACCESS_COOKIE, REFRESH_COOKIE, readCookie } from "@/lib/auth/session";

const SESSION_PATH = "/api/auth/session";
const REFRESH_ROUTE = "/api/auth/refresh";
const SIGNIN_PATH = "/signin";

/** Only the routes this file knows how to handle, whatever the matcher says. */
const GUARDED_RE = /^\/(account|checkout)(\/|$)/;

export const config = {
  // Literals, not `SESSION_PATH`: the matcher is parsed at compile time, so a
  // const reference is rejected by the Turbopack build ("need to be static
  // strings"). The constant above stays for the runtime branch.
  matcher: ["/api/auth/session", "/account/:path*", "/checkout/:path*"],
};

export default function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  if (pathname === SESSION_PATH) return forwardSession(request);
  if (!GUARDED_RE.test(pathname)) return NextResponse.next();

  if (readCookie(request.cookies, ACCESS_COOKIE) !== null) {
    return NextResponse.next();
  }

  // `pathname + search` is what the shopper actually asked for; `safeNextPath`
  // is what makes it safe to echo back into a redirect.
  const resume = safeNextPath(`${pathname}${request.nextUrl.search}`);

  if (readCookie(request.cookies, REFRESH_COOKIE) !== null) {
    const url = request.nextUrl.clone();
    url.pathname = REFRESH_ROUTE;
    url.search = "";
    url.searchParams.set("next", resume);
    return NextResponse.redirect(url);
  }

  const url = request.nextUrl.clone();
  url.pathname = SIGNIN_PATH;
  url.search = "";
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
