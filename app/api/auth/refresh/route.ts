/**
 * POST /api/auth/refresh — BFF handler
 *
 * Two callers, one handler:
 *   - the proxy, with `?next=/account/orders` — answers `303` so a browser
 *     navigation that finds an expired access cookie slides through the
 *     refresh and lands where it was going;
 *   - a client island, with no query string — answers `{ ok: true }`.
 *
 * Either way the new pair goes into HttpOnly cookies and never into the body.
 * A failed refresh clears BOTH cookies: leaving a dead `sf_rt` behind would
 * make the next navigation bounce between `/account` and here forever.
 */

import { NextResponse, type NextRequest } from "next/server";
import { authServiceUrl, createAuthClient } from "@/lib/auth/client";
import { safeNextPath } from "@/lib/auth/next";
import {
  clearedCookies,
  isSecureCookie,
  readCookie,
  REFRESH_COOKIE,
  sessionCookies,
} from "@/lib/auth/session";
import type { AuthErrorCode } from "@/lib/auth/errors";

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Presence, not value: `?next=` (empty) still means "resume me somewhere".
  const resume = request.nextUrl.searchParams.has("next")
    ? safeNextPath(request.nextUrl.searchParams.get("next"))
    : null;

  const refreshToken = readCookie(request.cookies, REFRESH_COOKIE);
  if (refreshToken === null) {
    return fail(request, resume, "TOKEN_EXPIRED", 401);
  }

  const result = await createAuthClient({
    baseUrl: authServiceUrl(),
  }).refresh(refreshToken);

  if (!result.ok) {
    return fail(request, resume, result.code, result.status === 0 ? 503 : result.status);
  }

  const secure = isSecureCookie();
  const response =
    resume === null
      ? NextResponse.json({ ok: true })
      : NextResponse.redirect(resumeUrl(request, resume), { status: 303 });

  for (const cookie of sessionCookies(result.data, { secure })) {
    response.cookies.set(cookie);
  }
  return response;
}

function fail(
  request: NextRequest,
  resume: string | null,
  code: AuthErrorCode,
  status: number,
): NextResponse {
  const secure = isSecureCookie();
  const response =
    resume === null
      ? NextResponse.json({ error: { code } }, { status })
      : NextResponse.redirect(signinUrl(request, resume), { status: 303 });

  for (const cookie of clearedCookies({ secure })) {
    response.cookies.set(cookie);
  }
  return response;
}

function resumeUrl(request: NextRequest, path: string): URL {
  return new URL(path, request.nextUrl.origin);
}

function signinUrl(request: NextRequest, path: string): URL {
  const url = new URL("/signin", request.nextUrl.origin);
  url.searchParams.set("next", path);
  return url;
}
