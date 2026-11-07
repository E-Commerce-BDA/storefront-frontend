/**
 * Global theme read — the root layout's never-rejects cascade.
 *
 * Theme is chrome, not content: live settings win, an outage after one success
 * serves stale settings, and no settings at all resolves to builtins. None of
 * those paths may throw — a theme read must never blank a route.
 */
import { describe, expect, it } from "vitest";
import type { ThemeSettings } from "@/lib/cms/themeSettings";
import { createMemoryCache } from "@/lib/cms/cache";
import {
  THEME_CACHE_KEY,
  fetchThemeSettings,
  type ThemeSource,
} from "@/lib/cms/theme";

const LIVE = { button: { bg: "#10233f" } } as ThemeSettings;

const cache = () => createMemoryCache<ThemeSettings>();

describe("fetchThemeSettings", () => {
  it("returns live theme settings", async () => {
    const source: ThemeSource = { fetchTheme: async () => LIVE };
    const result = await fetchThemeSettings({ source, cache: cache() });
    expect(result).toEqual({ theme: LIVE, stale: false, fallback: false });
  });

  it("serves the stale theme when cms-svc throws", async () => {
    const store = cache();
    store.set(THEME_CACHE_KEY, LIVE, 300);
    const source: ThemeSource = {
      fetchTheme: async () => {
        throw new Error("cms down");
      },
    };
    expect(await fetchThemeSettings({ source, cache: store })).toEqual({
      theme: LIVE,
      stale: true,
      fallback: false,
    });
  });

  it("falls back to null (builtins) when there is nothing to serve", async () => {
    const source: ThemeSource = { fetchTheme: async () => null };
    expect(await fetchThemeSettings({ source, cache: cache() })).toEqual({
      theme: null,
      stale: false,
      fallback: true,
    });
  });

  it("treats a null source response as an outage and serves stale cache", async () => {
    const store = cache();
    store.set(THEME_CACHE_KEY, LIVE, 300);
    const source: ThemeSource = { fetchTheme: async () => null };
    expect(await fetchThemeSettings({ source, cache: store })).toMatchObject({ stale: true });
  });
});
