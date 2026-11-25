import { describe, expect, it } from "vitest";
import {
  ACCOUNT_MENU_LINKS,
  isSafeNextPath,
  PUBLIC_SHELL_PATH,
  resolveAccountMenu,
  SIGN_OUT_ACTION,
} from "@/lib/shell/accountMenu";

describe("resolveAccountMenu", () => {
  it("owns the link set and the sign-out target in one place", () => {
    const model = resolveAccountMenu();
    expect(model.links).toEqual(ACCOUNT_MENU_LINKS);
    expect(model.signOut).toEqual({
      action: SIGN_OUT_ACTION,
      next: PUBLIC_SHELL_PATH,
      label: "Sign out",
    });
  });

  it("points the form at the POST-only handler and a public shell", () => {
    expect(resolveAccountMenu().signOut.action).toBe("/api/auth/logout");
    expect(resolveAccountMenu().signOut.next).toBe("/");
  });
});

describe("isSafeNextPath", () => {
  it("accepts same-origin relative paths", () => {
    expect(isSafeNextPath("/")).toBe(true);
    expect(isSafeNextPath("/products?sort=price")).toBe(true);
  });

  it("refuses protocol-relative and non-string escapes", () => {
    expect(isSafeNextPath("//evil.test")).toBe(false);
    expect(isSafeNextPath("/\\evil.test")).toBe(false);
    expect(isSafeNextPath("https://evil.test")).toBe(false);
    expect(isSafeNextPath(undefined)).toBe(false);
  });
});
