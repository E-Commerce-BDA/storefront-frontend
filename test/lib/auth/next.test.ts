/**
 * Open-redirect guard — `/signin?next=` arrives from the URL, so every
 * absolute-looking value has to be rejected before it becomes a redirect.
 */
import { describe, expect, it } from "vitest";
import { DEFAULT_NEXT_PATH, safeNextPath } from "@/lib/auth/next";

describe("safeNextPath", () => {
  it.each([
    "/account",
    "/account/orders",
    "/account/orders?page=2",
    "/checkout",
    "/checkout?step=payment",
    "/cart",
  ])("keeps the internal path %s", (path) => {
    expect(safeNextPath(path)).toBe(path);
  });

  it.each([
    "//evil.com",
    "//evil.com/account",
    "https://evil.com",
    "http://evil.com/account",
    "javascript:alert(1)",
    "/\\evil.com",
    "javascript:/account",
    "/admin",
    "/accounting",
    "",
    "   ",
    "account",
  ])("rejects %s and falls back to the default", (value) => {
    expect(safeNextPath(value)).toBe(DEFAULT_NEXT_PATH);
  });

  it("rejects non-strings (a query param can be repeated, hence never a string)", () => {
    expect(safeNextPath(undefined)).toBe(DEFAULT_NEXT_PATH);
    expect(safeNextPath(null)).toBe(DEFAULT_NEXT_PATH);
    expect(safeNextPath(["/account"])).toBe(DEFAULT_NEXT_PATH);
    expect(safeNextPath(42)).toBe(DEFAULT_NEXT_PATH);
  });

  it("rejects control characters smuggled into an otherwise valid path", () => {
    expect(safeNextPath("/account\u0000")).toBe(DEFAULT_NEXT_PATH);
    expect(safeNextPath("/account\nLocation: /evil")).toBe(DEFAULT_NEXT_PATH);
  });

  it("pins the fallback to the account page", () => {
    expect(DEFAULT_NEXT_PATH).toBe("/account");
  });
});
