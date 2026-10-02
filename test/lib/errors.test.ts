/**
 * Auth error map — total function: known codes pin copy, unknown falls back
 * to generic (display safety is a test, not a hope).
 */
import { describe, expect, it } from "vitest";
import { displayFor, GENERIC_AUTH_ERROR, isAuthErrorCode } from "@/lib/auth/errors";

describe("displayFor", () => {
  it("pins every known code to its documented copy", () => {
    expect(displayFor("EMAIL_TAKEN").message).toContain("already exists");
    expect(displayFor("TOKEN_REUSED").message).toContain("protection");
    expect(displayFor("RATE_LIMITED").message).toContain("Too many attempts");
  });

  it("falls back to generic for unknown/missing codes (never raw text)", () => {
    expect(displayFor("ROW_MISSING_IN_REFRESH_TOKENS")).toEqual(GENERIC_AUTH_ERROR);
    expect(displayFor(null)).toEqual(GENERIC_AUTH_ERROR);
    expect(displayFor(undefined)).toEqual(GENERIC_AUTH_ERROR);
  });

  it("login failures stay generic (no-enumeration rule)", () => {
    expect(displayFor("INVALID_CREDENTIALS")).toEqual(GENERIC_AUTH_ERROR);
    expect(isAuthErrorCode("INVALID_CREDENTIALS")).toBe(true);
    expect(isAuthErrorCode("USER_NOT_FOUND")).toBe(false);
  });
});
