/**
 * Cache tags — the allowlist behind `POST /api/revalidate`.
 *
 * A tag this module accepts is a cache key a caller can purge, so the negative
 * cases (arbitrary strings, oversize keys, wrong prefix) are the test.
 */
import { describe, expect, it } from "vitest";
import { CMS_STATIC_TAGS, cmsTag, isAllowedTag, isPageKey } from "@/lib/cms/tags";

describe("cmsTag", () => {
  it("builds the documented tags", () => {
    expect(cmsTag.pageSettings("auth")).toBe("cms:page-settings:auth");
    expect(cmsTag.sections("homepage")).toBe("cms:sections:homepage");
    expect(cmsTag.pages("about-us")).toBe("cms:pages:about-us");
    expect(cmsTag.globalSettings).toBe("cms:global-settings");
    expect(cmsTag.navigation).toBe("cms:navigation");
    expect(cmsTag.footer).toBe("cms:footer");
    expect(cmsTag.blogs).toBe("cms:blogs");
    expect(CMS_STATIC_TAGS).toEqual([
      "cms:global-settings",
      "cms:navigation",
      "cms:footer",
      "cms:blogs",
    ]);
  });
});

describe("isPageKey", () => {
  it("accepts lowercase slugs and rejects anything path-shaped", () => {
    expect(isPageKey("auth")).toBe(true);
    expect(isPageKey("home-2")).toBe(true);
    expect(isPageKey("Auth")).toBe(false);
    expect(isPageKey("auth/admin")).toBe(false);
    expect(isPageKey("../auth")).toBe(false);
    expect(isPageKey("a".repeat(81))).toBe(false);
    expect(isPageKey(7)).toBe(false);
  });
});

describe("isAllowedTag", () => {
  it.each([
    "cms:global-settings",
    "cms:navigation",
    "cms:footer",
    "cms:blogs",
    "cms:page-settings:auth",
    "cms:page-settings:home-2",
    "cms:sections:homepage",
    "cms:pages:about-us",
  ])("allows %s", (tag) => {
    expect(isAllowedTag(tag)).toBe(true);
  });

  it.each([
    "",
    "auth",
    "cms:",
    "cms:page-settings:",
    "cms:page-settings:Auth",
    "cms:page-settings:../auth",
    "cms:page-settings:" + "a".repeat(81),
    "cms:page-settings",
    "cms:sections:",
    "cms:sections:Homepage",
    "cms:sections:" + "a".repeat(81),
    "cms:pages:",
    "cms:pages:a/b",
    "cms:footers",
    "other:navigation",
    "cms:navigation ",
  ])("rejects %s", (tag) => {
    expect(isAllowedTag(tag)).toBe(false);
  });

  it("rejects non-strings without throwing", () => {
    expect(isAllowedTag(undefined)).toBe(false);
    expect(isAllowedTag(null)).toBe(false);
    expect(isAllowedTag(["cms:navigation"])).toBe(false);
    expect(isAllowedTag(1)).toBe(false);
  });
});
