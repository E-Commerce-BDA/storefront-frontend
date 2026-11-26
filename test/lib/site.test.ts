import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildHomeJsonLd,
  SITE_DESCRIPTION,
  SITE_NAME,
  serializeJsonLd,
  siteUrl,
} from "@/lib/site";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("site identity", () => {
  it("resolves the public origin from env and drops trailing slashes", () => {
    vi.stubEnv("SITE_URL", "https://shop.example///");
    expect(siteUrl()).toBe("https://shop.example");
  });

  it("falls back to the local origin when the env is unset or empty", () => {
    vi.stubEnv("SITE_URL", "");
    expect(siteUrl()).toBe("http://localhost:3000");
  });

  it("builds a WebSite node with only the fields the site actually owns", () => {
    vi.stubEnv("SITE_URL", "https://shop.example");
    const ld = buildHomeJsonLd();
    expect(ld).toMatchObject({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      url: "https://shop.example",
      description: SITE_DESCRIPTION,
    });
    expect(Object.keys(ld)).toHaveLength(5);
  });

  it("escapes '<' so a branded string cannot close the script tag", () => {
    const ld = buildHomeJsonLd();
    ld.name = "</script><script>alert(1)</script>";
    const html = serializeJsonLd(ld);
    expect(html).not.toContain("<");
    expect(html).toContain("\\u003c/script>");
    expect(JSON.parse(html).name).toBe("</script><script>alert(1)</script>");
  });
});
