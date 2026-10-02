/**
 * Auth settings fetcher — hit / miss / stale / down / timeout.
 * Source + cache are stubbed interfaces; no network, no mocks of fetch.
 */
import { describe, expect, it, vi } from "vitest";
import {
  createCmsSource,
  fetchAuthSettings,
  type AuthSettingsCache,
  type AuthSettingsEntry,
  type AuthSettingsSource,
} from "@/lib/cms/authSettings";

const ENTRY: AuthSettingsEntry = { settings: { pages: { signin: { mode: "centered" } } }, version: 7 };

function memCache(seed: AuthSettingsEntry | null = null): AuthSettingsCache & { store: Map<string, AuthSettingsEntry> } {
  const store = new Map<string, AuthSettingsEntry>();
  if (seed) store.set("auth", seed);
  return {
    store,
    get: (k: string) => store.get(k) ?? null,
    set: (k: string, e: AuthSettingsEntry) => {
      store.set(k, e);
    },
  };
}

describe("fetchAuthSettings", () => {
  it("serves fresh source and populates cache", async () => {
    const source: AuthSettingsSource = { fetchPage: async () => ENTRY };
    const cache = memCache();
    const r = await fetchAuthSettings("auth", { source, cache });
    expect(r).toEqual({ settings: ENTRY.settings, version: 7, stale: false });
    expect(cache.store.get("auth")).toEqual(ENTRY);
  });

  it("serves stale cache when the source throws", async () => {
    const source: AuthSettingsSource = {
      fetchPage: async () => {
        throw new Error("cms down");
      },
    };
    const r = await fetchAuthSettings("auth", { source, cache: memCache(ENTRY) });
    expect(r).toEqual({ settings: ENTRY.settings, version: 7, stale: true });
  });

  it("returns null when source and cache both fail (builtins render)", async () => {
    const source: AuthSettingsSource = { fetchPage: async () => null };
    const r = await fetchAuthSettings("auth", { source, cache: memCache() });
    expect(r).toEqual({ settings: null, version: null, stale: false });
  });

  it("aborts a slow source and falls back to cache", async () => {
    const source: AuthSettingsSource = {
      fetchPage: (_k, signal) =>
        new Promise((_res, rej) => {
          signal.addEventListener("abort", () => rej(new Error("aborted")));
        }),
    };
    const r = await fetchAuthSettings("auth", { source, cache: memCache(ENTRY), timeoutMs: 20 });
    expect(r.stale).toBe(true);
    expect(r.version).toBe(7);
  });
});

describe("createCmsSource", () => {
  it("returns null on non-OK and malformed bodies (never throws shape errors)", async () => {
    const bad = createCmsSource("https://cms", (async () => ({ ok: false, json: async () => ({}) })) as unknown as typeof fetch);
    expect(await bad.fetchPage("auth", new AbortController().signal)).toBeNull();
    const malformed = createCmsSource("https://cms", (async () => ({
      ok: true,
      json: async () => ({ content: "nope", version: "x" }),
    })) as unknown as typeof fetch);
    expect(await malformed.fetchPage("auth", new AbortController().signal)).toBeNull();
  });

  it("maps the cms-svc envelope", async () => {
    const fetchFn = vi.fn(async () => ({ ok: true, json: async () => ({ content: ENTRY.settings, version: 7 }) }));
    const src = createCmsSource("https://cms", fetchFn as unknown as typeof fetch);
    expect(await src.fetchPage("auth", new AbortController().signal)).toEqual(ENTRY);
    expect(fetchFn).toHaveBeenCalledWith("https://cms/api/v1/cms/pages/auth", expect.objectContaining({}));
  });
});
