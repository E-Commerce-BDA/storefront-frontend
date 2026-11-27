/**
 * Resolver-unit tier for the CMS cache policy (sf-096).
 *
 * The rule is deliberately tiny: a preview token means no-store, everything
 * else keeps the published tag and ceiling. A regression here is invisible in
 * the UI — drafts just occasionally leak to shoppers — so the resolver is
 * asserted directly, not only through a mocked route.
 */
import { describe, expect, it } from "vitest";
import { CMS_REVALIDATE_SECONDS, cmsFetchCache } from "@/lib/cms/cachePolicy";

describe("cmsFetchCache", () => {
  it("bypasses the Data Cache entirely for a preview read", () => {
    expect(cmsFetchCache("cms:sections:homepage", "draft-token")).toEqual({ cache: "no-store" });
  });

  it("keeps published reads tagged and request-fresh on the webhook ceiling", () => {
    expect(cmsFetchCache("cms:navigation", null)).toEqual({
      next: { tags: ["cms:navigation"], revalidate: CMS_REVALIDATE_SECONDS },
    });
    expect(CMS_REVALIDATE_SECONDS).toBe(300);
  });

  it("treats undefined and blank tokens as published", () => {
    expect(cmsFetchCache("cms:footer", undefined)).toEqual({
      next: { tags: ["cms:footer"], revalidate: 300 },
    });
    expect(cmsFetchCache("cms:footer", "   ")).toEqual({
      next: { tags: ["cms:footer"], revalidate: 300 },
    });
  });

  it("honours a shorter published ceiling but never applies it to preview", () => {
    expect(cmsFetchCache("cms:pages:about", null, 60)).toEqual({
      next: { tags: ["cms:pages:about"], revalidate: 60 },
    });
    expect(cmsFetchCache("cms:pages:about", "tok", 60)).toEqual({ cache: "no-store" });
  });

  it("never emits a tag for preview — header tokens are not part of a cache key", () => {
    const policy = cmsFetchCache("cms:sections:homepage", "tok");
    expect(policy).not.toHaveProperty("next");
    expect(JSON.stringify(policy)).not.toContain("cms:");
  });
});
