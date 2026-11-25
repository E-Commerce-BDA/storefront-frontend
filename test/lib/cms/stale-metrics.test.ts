/**
 * sf-073 acceptance: a forced CMS outage increments the fallback counter,
 * and serving yesterday's copy increments the stale counter. The readers'
 * existing cascade tests cover the returned values; this file pins the
 * scrapeable side effect those tests could not see.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { createMemoryCache } from "@/lib/cms/cache";
import { fetchAuthSettings, type AuthSettingsCache } from "@/lib/cms/authSettings";
import { fetchFooter } from "@/lib/cms/footer";
import { fetchNavSettings, NAV_CACHE_KEY, type NavSettingsEntry } from "@/lib/cms/navigation";
import { fetchThemeSettings } from "@/lib/cms/theme";
import { metricSnapshot, resetMetrics } from "@/lib/metrics/counters";
import { DEMO_NAV_INPUT } from "@/lib/shell/demoNavInput";

beforeEach(resetMetrics);

const OUTAGE = {
  fetchNavigation: async () => {
    throw new Error("cms down");
  },
  fetchFooter: async () => {
    throw new Error("cms down");
  },
  fetchTheme: async () => {
    throw new Error("cms down");
  },
  fetchPage: async () => {
    throw new Error("cms down");
  },
};

describe("CMS fallback/stale counters", () => {
  it("counts a forced nav outage as a fallback, not a stale read", async () => {
    const result = await fetchNavSettings({ source: OUTAGE, cache: createMemoryCache() });
    expect(result.fallback).toBe(true);
    expect(metricSnapshot().cms_fallback_reads_total).toBe(1);
    expect(metricSnapshot().cms_stale_reads_total).toBe(0);
  });

  it("counts a nav stale serve separately from the builtin fallback", async () => {
    const cache = createMemoryCache<NavSettingsEntry>();
    cache.set(NAV_CACHE_KEY, { settings: DEMO_NAV_INPUT, version: 7 }, 300);
    await fetchNavSettings({ source: OUTAGE, cache });
    expect(metricSnapshot().cms_stale_reads_total).toBe(1);
    expect(metricSnapshot().cms_fallback_reads_total).toBe(0);
  });

  it("counts footer and theme outages on the same surface", async () => {
    await fetchFooter({ source: OUTAGE, cache: createMemoryCache() });
    await fetchThemeSettings({ source: OUTAGE, cache: createMemoryCache() });
    expect(metricSnapshot().cms_fallback_reads_total).toBe(2);
  });

  it("counts the auth-settings builtin fallback", async () => {
    const emptyCache: AuthSettingsCache = {
      get: () => null,
      set: () => {},
    };
    const result = await fetchAuthSettings("auth", { source: OUTAGE, cache: emptyCache });
    expect(result.settings).toBeNull();
    expect(metricSnapshot().cms_fallback_reads_total).toBe(1);
  });

  it("does not count a healthy read", async () => {
    await fetchNavSettings({
      source: { fetchNavigation: async () => ({ settings: DEMO_NAV_INPUT, version: 7 }) },
      cache: createMemoryCache(),
    });
    expect(metricSnapshot().cms_stale_reads_total).toBe(0);
    expect(metricSnapshot().cms_fallback_reads_total).toBe(0);
  });
});
