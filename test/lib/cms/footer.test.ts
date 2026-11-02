/**
 * Footer read + mount cascade — sf-062
 * (plan §7)
 *
 * The behaviour under test is "the global shell never disappears and never
 * invents content": live document → CMS face, outage after a success → stale
 * document, outage with nothing cached → `null` (the minimal face), and auth
 * routes → no footer at all.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { createMemoryCache } from "@/lib/cms/cache";
import {
  createCmsFooterSource,
  fetchFooter,
  FOOTER_CACHE_KEY,
  type FooterSource,
} from "@/lib/cms/footer";
import { createCmsClient } from "@/lib/cms/client";
import type { Footer } from "@ecom/contracts";

const LIVE: Footer = {
  columns: [
    {
      title: "Shop",
      links: [
        { label: "All products", href: "/products" },
        { label: "Deals", href: "/products?sale=1" },
      ],
    },
    { title: "Company", links: [{ label: "About us", href: "/about" }] },
  ],
  social: [{ platform: "instagram", label: "Instagram", url: "https://instagram.com/foreafcbeta" }],
  legal: [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
  ],
  contact: { email: "help@foreafcbeta.test", phone: "+91 90000 00000", address: "Surat, Gujarat" },
  wordmark: "foreafcbeta",
  tagline: "Everything for every day.",
  copyright: "© 2026 foreafcbeta",
  paymentIcons: ["visa", "upi"],
};

function cache() {
  return createMemoryCache<Footer>();
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("fetchFooter", () => {
  it("returns the CMS document and fills the cache", async () => {
    const store = cache();
    const source: FooterSource = { fetchFooter: async () => LIVE };

    const result = await fetchFooter({ source, cache: store });

    expect(result).toEqual({ footer: LIVE, stale: false, fallback: false });
    expect(store.get(FOOTER_CACHE_KEY)).toEqual(LIVE);
  });

  it("serves the stale document when cms-svc throws", async () => {
    const store = cache();
    store.set(FOOTER_CACHE_KEY, LIVE, 300);
    const source: FooterSource = {
      fetchFooter: async () => {
        throw new Error("cms down");
      },
    };

    expect(await fetchFooter({ source, cache: store })).toEqual({
      footer: LIVE,
      stale: true,
      fallback: false,
    });
  });

  it("returns null — not an invented footer — with no source and no cache", async () => {
    const source: FooterSource = { fetchFooter: async () => null };

    expect(await fetchFooter({ source, cache: cache() })).toEqual({
      footer: null,
      stale: false,
      fallback: true,
    });
  });

  it("treats a null read exactly like a failure", async () => {
    const store = cache();
    store.set(FOOTER_CACHE_KEY, LIVE, 300);
    const source: FooterSource = { fetchFooter: async () => null };

    expect(await fetchFooter({ source, cache: store })).toMatchObject({ stale: true });
  });

  it("honours a short ttl so a test (or a low-cache mode) can expire the entry", async () => {
    const store = cache();
    const source: FooterSource = { fetchFooter: async () => LIVE };

    await fetchFooter({ source, cache: store, cacheTtlSeconds: 0 });
    expect(store.get(FOOTER_CACHE_KEY)).toBeNull();
  });
});

describe("createCmsFooterSource", () => {
  it("unwraps the { footer, version } envelope, and passes null through", async () => {
    const ok = createCmsFooterSource(
      createCmsClient({
        baseUrl: "http://cms.test",
        fetchFn: (async (input: string) => {
          expect(input).toBe("http://cms.test/api/v1/cms/footer");
          return new Response(JSON.stringify({ footer: LIVE, version: 4 }));
        }) as unknown as typeof fetch,
      }),
    );
    expect(await ok.fetchFooter()).toEqual(LIVE);

    const down = createCmsFooterSource(
      createCmsClient({
        baseUrl: "http://cms.test",
        fetchFn: (async () => new Response(null, { status: 503 })) as unknown as typeof fetch,
      }),
    );
    expect(await down.fetchFooter()).toBeNull();
  });

  it("refuses a body the contracts schema rejects — a bad footer is an outage, not a render", async () => {
    const source = createCmsFooterSource(
      createCmsClient({
        baseUrl: "http://cms.test",
        fetchFn: (async () =>
          new Response(JSON.stringify({ footer: { columns: "todo" }, version: 4 }))) as unknown as typeof fetch,
      }),
    );
    expect(await source.fetchFooter()).toBeNull();
  });
});
