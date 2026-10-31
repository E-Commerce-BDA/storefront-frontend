/**
 * Session cookies — sf-049
 * (Documentation/pages/auth-design.md §92: HttpOnly storage, 15m/30d)
 *
 * Pure: no `next/headers`, no request object. The route handlers build the
 * specs and hand them to `NextResponse.cookies`; the proxy only asks whether a
 * cookie is present. Keeping this module free of framework imports is why the
 * cookie attributes can be asserted in a plain node test.
 *
 * WHY the refresh cookie is scoped to `/api/auth`: the browser must send it to
 * `/api/auth/refresh` (and nowhere else). Scoping it to `/` would attach a
 * 30-day credential to every asset request — larger blast radius for no gain,
 * because only the refresh handler consumes it.
 */

import type { TokenPair } from "./client";

export const ACCESS_COOKIE = "sf_at";
export const REFRESH_COOKIE = "sf_rt";
export const REFRESH_PATH = "/api/auth";

/** 15 minutes — mirrors auth-svc's access-token lifetime. */
export const ACCESS_TTL_SECONDS = 15 * 60;
/** 30 days — mirrors auth-svc's refresh-token lifetime. */
export const REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60;

export interface CookieSpec {
  name: string;
  value: string;
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
}

/** The shape both `Request.cookies` and a real cookie jar satisfy. */
export interface CookieReader {
  get(name: string): { value: string } | undefined;
}

export function sessionCookies(
  tokens: TokenPair,
  options: { secure: boolean },
): CookieSpec[] {
  return [
    {
      name: ACCESS_COOKIE,
      value: tokens.accessToken,
      httpOnly: true,
      secure: options.secure,
      sameSite: "lax",
      path: "/",
      maxAge: ACCESS_TTL_SECONDS,
    },
    {
      name: REFRESH_COOKIE,
      value: tokens.refreshToken,
      httpOnly: true,
      secure: options.secure,
      sameSite: "lax",
      path: REFRESH_PATH,
      maxAge: REFRESH_TTL_SECONDS,
    },
  ];
}

/**
 * Sign-out has to expire both cookies with the same attributes they were set
 * with — a `path` mismatch leaves the original cookie alive in the browser
 * while looking signed out on the server.
 */
export function clearedCookies(options: { secure: boolean }): CookieSpec[] {
  return [
    {
      name: ACCESS_COOKIE,
      value: "",
      httpOnly: true,
      secure: options.secure,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    },
    {
      name: REFRESH_COOKIE,
      value: "",
      httpOnly: true,
      secure: options.secure,
      sameSite: "lax",
      path: REFRESH_PATH,
      maxAge: 0,
    },
  ];
}

export function readCookie(
  cookies: CookieReader,
  name: string,
): string | null {
  const value = cookies.get(name)?.value;
  return typeof value === "string" && value.length > 0 ? value : null;
}

/** True when the caller holds a usable access cookie. */
export function hasSession(cookies: CookieReader): boolean {
  return readCookie(cookies, ACCESS_COOKIE) !== null;
}

export function isSecureCookie(): boolean {
  return process.env.NODE_ENV === "production";
}
