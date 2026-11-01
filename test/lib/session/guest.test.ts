/**
 * `sf_cid` — the guest cart id.
 *
 * The attributes are asserted as a whole object rather than one regex at a
 * time: a cookie that loses `httpOnly` still passes "has a name and a value",
 * and that is exactly the regression worth catching. The id format is asserted
 * against cart-svc's guard pattern because a mismatch there turns every cart
 * call into a 400 that the shopper cannot fix from the UI.
 */
import { describe, expect, it } from "vitest";
import {
  GUEST_COOKIE,
  GUEST_ID_PATTERN,
  GUEST_TTL_SECONDS,
  guestCookie,
  isGuestId,
  mintGuestId,
} from "@/lib/session/guest";

describe("the guest cookie", () => {
  it("is sf_cid, the value cart-svc reads as x-session-id", () => {
    expect(GUEST_COOKIE).toBe("sf_cid");
  });

  it("is HttpOnly, Lax and readable from every route", () => {
    expect(guestCookie("abc12345", { secure: false })).toEqual({
      name: "sf_cid",
      value: "abc12345",
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });
  });

  it("keeps the Secure flag in production — a basket id is a credential", () => {
    expect(guestCookie("abc12345", { secure: true }).secure).toBe(true);
  });

  it("expires in 30 days", () => {
    expect(GUEST_TTL_SECONDS).toBe(2592000);
  });

  it("clears itself when handed an empty value", () => {
    expect(guestCookie("", { secure: false }).maxAge).toBe(0);
  });
});

describe("the guest id", () => {
  it("mirrors cart-svc's CartIdentityGuard pattern", () => {
    expect(GUEST_ID_PATTERN.source).toBe("^[A-Za-z0-9._~-]{8,64}$");
  });

  it("mints a UUID that satisfies the pattern", () => {
    const id = mintGuestId();

    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    expect(isGuestId(id)).toBe(true);
  });

  it("mints a different id every time", () => {
    expect(mintGuestId()).not.toBe(mintGuestId());
  });

  it("accepts the shortest and longest legal ids", () => {
    expect(isGuestId("a".repeat(8))).toBe(true);
    expect(isGuestId("a".repeat(64))).toBe(true);
  });

  it("rejects ids cart-svc would answer 400 for", () => {
    expect(isGuestId("short")).toBe(false);
    expect(isGuestId("a".repeat(65))).toBe(false);
    expect(isGuestId("has space")).toBe(false);
    expect(isGuestId("semi;colon")).toBe(false);
    expect(isGuestId("")).toBe(false);
  });

  it("rejects non-strings", () => {
    expect(isGuestId(null)).toBe(false);
    expect(isGuestId(undefined)).toBe(false);
    expect(isGuestId(42)).toBe(false);
    expect(isGuestId({ value: "abc12345" })).toBe(false);
  });
});
