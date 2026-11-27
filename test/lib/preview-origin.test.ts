/** Origin boundary for the preview frame and postMessage channel. */
import { describe, expect, it } from "vitest";
import { DEFAULT_ADMIN_ORIGIN, resolveAdminOrigin } from "@/lib/preview/origin";

describe("resolveAdminOrigin", () => {
  it("defaults to the admin dev port", () => {
    expect(resolveAdminOrigin(undefined)).toBe(DEFAULT_ADMIN_ORIGIN);
    expect(resolveAdminOrigin("  ")).toBe(DEFAULT_ADMIN_ORIGIN);
  });

  it("normalises to an exact scheme/host/port origin", () => {
    expect(resolveAdminOrigin("https://admin.example.test:8443/some/path?q=1")).toBe(
      "https://admin.example.test:8443",
    );
    expect(resolveAdminOrigin("http://localhost:3001/")).toBe("http://localhost:3001");
  });

  it.each([
    "javascript:alert(1)",
    "//admin.example.test",
    "http://user:pass@admin.example.test",
    "not a url",
  ])("rejects %s rather than admitting a lookalike", (value) => {
    expect(resolveAdminOrigin(value)).toBeNull();
  });
});
