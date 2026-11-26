import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("/sitemap.xml", () => {
  it("lists absolute URLs for every public route under the configured origin", async () => {
    vi.stubEnv("SITE_URL", "https://shop.example/");
    const { default: sitemap } = await import("@/app/sitemap");
    const entries = sitemap();

    expect(entries.map((entry) => entry.url)).toEqual([
      "https://shop.example",
      "https://shop.example/products",
      "https://shop.example/blog",
      "https://shop.example/about",
      "https://shop.example/terms",
      "https://shop.example/privacy",
    ]);
    expect(entries[0]).toMatchObject({ priority: 1, changeFrequency: "weekly" });
    expect(entries.every((entry) => entry.lastModified instanceof Date)).toBe(true);
  });

  it("uses the local origin when no deployment origin is configured", async () => {
    vi.stubEnv("SITE_URL", "");
    const { default: sitemap } = await import("@/app/sitemap");
    expect(sitemap()[0]!.url).toBe("http://localhost:3000");
  });
});

describe("/robots.txt", () => {
  it("allows crawling and advertises the sitemap at the same origin", async () => {
    vi.stubEnv("SITE_URL", "https://shop.example/");
    const { default: robots } = await import("@/app/robots");
    expect(robots()).toEqual({
      rules: { userAgent: "*", allow: "/" },
      sitemap: "https://shop.example/sitemap.xml",
    });
  });
});
