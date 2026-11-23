/**
 * Navigation cascade — CMS up, CMS down, CMS stale.
 *
 * The navbar renders on every route, so the assertion that matters is the one
 * about cms-svc being down: the layout must still get a `NavSettings` value,
 * never a rejection and never null.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { createMemoryCache } from "@/lib/cms/cache";
import {
  createCmsNavSource,
  fetchNavSettings,
  NAV_CACHE_KEY,
  type NavSettingsEntry,
  type NavSettingsSource,
} from "@/lib/cms/navigation";
import { createCmsClient } from "@/lib/cms/client";
import { DEMO_NAV_INPUT } from "@/lib/shell/demoNavInput";
import { resolveNavSettings } from "@/lib/shell/resolveNav";

const LIVE: NavSettingsEntry = {
  settings: {
    shared: {
      links: {
        maxItems: 3,
        items: [
          { kind: "custom", label: "Live drops", href: "/live" },
          { kind: "custom", label: "Journal", href: "/journal" },
        ],
      },
    },
  },
  version: 12,
};

function cache() {
  return createMemoryCache<NavSettingsEntry>();
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("fetchNavSettings", () => {
  it("returns the CMS nav and fills the cache", async () => {
    const store = cache();
    const source: NavSettingsSource = { fetchNavigation: async () => LIVE };

    const result = await fetchNavSettings({ source, cache: store });

    expect(result).toEqual({ settings: LIVE.settings, version: 12, stale: false, fallback: false });
    expect(store.get(NAV_CACHE_KEY)).toEqual(LIVE);

    // The resolved shape is what the layout hands to NavbarMount.
    const resolved = resolveNavSettings({ settings: result.settings, global: null });
    expect(resolved.links.items.map((link) => link.label)).toEqual(["Live drops", "Journal"]);
  });

  it("serves stale cache when cms-svc throws", async () => {
    const store = cache();
    store.set(NAV_CACHE_KEY, LIVE, 300);
    const source: NavSettingsSource = {
      fetchNavigation: async () => {
        throw new Error("cms down");
      },
    };

    const result = await fetchNavSettings({ source, cache: store });

    expect(result).toMatchObject({ version: 12, stale: true, fallback: false });
    expect(result.settings).toBe(LIVE.settings);
  });

  it("falls back to the demo nav when there is no source and no cache", async () => {
    const source: NavSettingsSource = { fetchNavigation: async () => null };

    const result = await fetchNavSettings({ source, cache: cache() });

    expect(result).toEqual({ settings: DEMO_NAV_INPUT, version: null, stale: false, fallback: true });
    expect(resolveNavSettings({ settings: result.settings, global: null }).links.items.length).toBeGreaterThan(0);
  });

  it("treats a null read exactly like a failure", async () => {
    const store = cache();
    store.set(NAV_CACHE_KEY, LIVE, 300);
    const source: NavSettingsSource = { fetchNavigation: async () => null };

    expect(await fetchNavSettings({ source, cache: store })).toMatchObject({ stale: true });
  });
});

describe("createCmsNavSource", () => {
  it("maps the cms-svc envelope onto an entry, and null through", async () => {
    const ok = createCmsNavSource(
      createCmsClient({
        baseUrl: "http://cms.test",
        fetchFn: (async () => new Response(JSON.stringify({ navbar: LIVE.settings, version: 12 }))) as unknown as typeof fetch,
      }),
    );
    expect(await ok.fetchNavigation()).toEqual(LIVE);

    const down = createCmsNavSource(
      createCmsClient({
        baseUrl: "http://cms.test",
        fetchFn: (async () => new Response(null, { status: 503 })) as unknown as typeof fetch,
      }),
    );
    expect(await down.fetchNavigation()).toBeNull();
  });
});
