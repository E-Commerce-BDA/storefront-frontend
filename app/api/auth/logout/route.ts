/**
 * POST /api/auth/logout — BFF handler
 *
 * Revoke, then clear locally — in that order, but nobody waits for the first.
 * A failed revoke is not allowed to keep the shopper signed in on this device:
 * the cookies go regardless, and the refresh token (if the call never landed)
 * simply ages out server-side on its 30-day clock.
 *
 * POST only. A `GET /api/auth/logout` would be a side effect a cross-site
 * link could trigger (SameSite=Lax still sends cookies on a top-level GET),
 * so the account menu posts a form instead.
 */

import { NextResponse, type NextRequest } from "next/server";
import { authServiceUrl, createAuthClient } from "@/lib/auth/client";
import { clearedCookies, isSecureCookie, readCookie, REFRESH_COOKIE } from "@/lib/auth/session";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const refreshToken = readCookie(request.cookies, REFRESH_COOKIE);

  if (refreshToken !== null) {
    await createAuthClient({ baseUrl: authServiceUrl() }).logout(refreshToken);
  }

  const response = new NextResponse(null, { status: 204 });
  for (const cookie of clearedCookies({ secure: isSecureCookie() })) {
    response.cookies.set(cookie);
  }
  return response;
}
