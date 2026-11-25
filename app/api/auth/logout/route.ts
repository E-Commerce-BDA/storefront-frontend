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
 *
 * The two callers get different answers from one handler: a fetch from an
 * island wants a bare 204, while the native form in the shell wants a 303 to
 * the public shell. The `next` field is what distinguishes them, and it is
 * validated as a same-origin relative path before it is used.
 */

import { NextResponse, type NextRequest } from "next/server";
import { authServiceUrl, createAuthClient } from "@/lib/auth/client";
import { clearedCookies, isSecureCookie, readCookie, REFRESH_COOKIE } from "@/lib/auth/session";
import { isSafeNextPath } from "@/lib/shell/accountMenu";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const refreshToken = readCookie(request.cookies, REFRESH_COOKIE);

  if (refreshToken !== null) {
    await createAuthClient({ baseUrl: authServiceUrl() }).logout(refreshToken);
  }

  const next = await readNextPath(request);
  // 303 turns the browser's POST into a GET on the target. A 302 would make
  // the browser repeat the POST against the public shell.
  const response =
    next === null
      ? new NextResponse(null, { status: 204 })
      : NextResponse.redirect(new URL(next, request.url), { status: 303 });
  for (const cookie of clearedCookies({ secure: isSecureCookie() })) {
    response.cookies.set(cookie);
  }
  return response;
}

async function readNextPath(request: NextRequest): Promise<string | null> {
  const type = request.headers.get("content-type") ?? "";
  if (!type.includes("application/x-www-form-urlencoded")) return null;
  try {
    const value = (await request.formData()).get("next");
    return isSafeNextPath(value) ? value : null;
  } catch {
    return null;
  }
}
