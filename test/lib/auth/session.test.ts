/**
 * Session cookies — attributes are the security story, so they are asserted
 * literally: HttpOnly, SameSite=Lax, and a refresh cookie scoped to
 * `/api/auth` instead of the whole origin.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ACCESS_COOKIE,
  ACCESS_TTL_SECONDS,
  clearedCookies,
  hasSession,
  isSecureCookie,
  readCookie,
  REFRESH_COOKIE,
  REFRESH_PATH,
  REFRESH_TTL_SECONDS,
  sessionCookies,
} from "@/lib/auth/session";

const TOKENS = { accessToken: "at_1", refreshToken: "rt_1" };

function jar(entries: Record<string, string>) {
  return {
    get: (name: string) =>
      Object.prototype.hasOwnProperty.call(entries, name) ? { value: entries[name] } : undefined,
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("sessionCookies", () => {
  it("keeps the access token on / for 15 minutes and the refresh token on /api/auth for 30 days", () => {
    const [access, refresh] = sessionCookies(TOKENS, { secure: false });

    expect(access).toEqual({
      name: ACCESS_COOKIE,
      value: "at_1",
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: ACCESS_TTL_SECONDS,
    });
    expect(refresh).toEqual({
      name: REFRESH_COOKIE,
      value: "rt_1",
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: REFRESH_PATH,
      maxAge: REFRESH_TTL_SECONDS,
    });
    expect(ACCESS_TTL_SECONDS).toBe(15 * 60);
    expect(REFRESH_TTL_SECONDS).toBe(30 * 24 * 60 * 60);
  });

  it("marks both cookies Secure when asked", () => {
    for (const cookie of sessionCookies(TOKENS, { secure: true })) {
      expect(cookie.secure).toBe(true);
    }
  });
});

describe("clearedCookies", () => {
  it("expires both cookies with the same path they were set with", () => {
    const [access, refresh] = clearedCookies({ secure: false });

    expect(access).toMatchObject({ name: ACCESS_COOKIE, value: "", maxAge: 0, path: "/" });
    // A path mismatch here is the classic "looks signed out, is not" bug.
    expect(refresh).toMatchObject({
      name: REFRESH_COOKIE,
      value: "",
      maxAge: 0,
      path: REFRESH_PATH,
    });
  });
});

describe("readCookie / hasSession", () => {
  it("returns null for a missing or empty cookie", () => {
    expect(readCookie(jar({}), ACCESS_COOKIE)).toBeNull();
    expect(readCookie(jar({ [ACCESS_COOKIE]: "" }), ACCESS_COOKIE)).toBeNull();
  });

  it("returns the value when present", () => {
    expect(readCookie(jar({ [ACCESS_COOKIE]: "at_1" }), ACCESS_COOKIE)).toBe("at_1");
  });

  it("treats a refresh-only jar as signed out for page purposes", () => {
    expect(hasSession(jar({ [REFRESH_COOKIE]: "rt_1" }))).toBe(false);
    expect(hasSession(jar({ [ACCESS_COOKIE]: "at_1" }))).toBe(true);
  });
});

describe("isSecureCookie", () => {
  it("is on only in production, so localhost stays http", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(isSecureCookie()).toBe(true);

    vi.stubEnv("NODE_ENV", "development");
    expect(isSecureCookie()).toBe(false);
  });
});
