/**
 * Bounded TTL cache — the "cms-svc just died" fallback.
 *
 * Two properties carry the whole module: an entry disappears once it is older
 * than its TTL, and the map never grows past its cap. Everything else is
 * convenience. The clock is injected so expiry is asserted, not slept through.
 */
import { describe, expect, it } from "vitest";
import { createMemoryCache, MEMORY_CACHE_MAX_ENTRIES } from "@/lib/cms/cache";

function clock(start = 1_000): { now: () => number; advance: (ms: number) => void } {
  let current = start;
  return {
    now: () => current,
    advance: (ms) => {
      current += ms;
    },
  };
}

describe("createMemoryCache", () => {
  it("returns null for a key it has never seen", () => {
    const store = createMemoryCache<string>();
    expect(store.get("cms:navigation")).toBeNull();
  });

  it("serves a value until its TTL elapses, then drops it", () => {
    const time = clock();
    const store = createMemoryCache<string>({ now: time.now });

    store.set("cms:page-settings:auth", "hero", 300);

    time.advance(299_000);
    expect(store.get("cms:page-settings:auth")).toBe("hero");

    time.advance(1_000);
    expect(store.get("cms:page-settings:auth")).toBeNull();
  });

  it("evicts an expired entry on read, not on the next write", () => {
    const time = clock();
    const store = createMemoryCache<string>({ now: time.now, maxEntries: 1 });

    store.set("a", "1", 60);
    time.advance(61_000);
    expect(store.get("a")).toBeNull();

    store.set("b", "2", 60);
    expect(store.get("b")).toBe("2");
  });

  it("treats a zero TTL as immediately expired, never as 'never expires'", () => {
    const time = clock();
    const store = createMemoryCache<string>({ now: time.now });

    store.set("a", "1", 0);
    expect(store.get("a")).toBeNull();
  });

  it("evicts the oldest entry once the cap is reached", () => {
    const time = clock();
    const store = createMemoryCache<string>({ now: time.now, maxEntries: 2 });

    store.set("a", "1", 60);
    store.set("b", "2", 60);
    store.set("c", "3", 60);

    expect(store.get("a")).toBeNull();
    expect(store.get("b")).toBe("2");
    expect(store.get("c")).toBe("3");
  });

  it("moves a re-inserted key to the back of the eviction order", () => {
    const time = clock();
    const store = createMemoryCache<string>({ now: time.now, maxEntries: 2 });

    store.set("a", "1", 60);
    store.set("b", "2", 60);
    // `a` is still being read, so it must survive the next insert.
    store.set("a", "1b", 60);
    store.set("c", "3", 60);

    expect(store.get("a")).toBe("1b");
    expect(store.get("b")).toBeNull();
    expect(store.get("c")).toBe("3");
  });

  it("defaults to a bounded 32 entries", () => {
    const store = createMemoryCache<number>();

    for (let i = 0; i < MEMORY_CACHE_MAX_ENTRIES + 5; i += 1) store.set(`k${i}`, i, 60);

    expect(store.get("k0")).toBeNull();
    expect(store.get(`k${MEMORY_CACHE_MAX_ENTRIES + 4}`)).toBe(MEMORY_CACHE_MAX_ENTRIES + 4);
  });

  it("clamps nonsense options instead of throwing", () => {
    const store = createMemoryCache<string>({ maxEntries: 0 });
    store.set("a", "1", 60);
    store.set("b", "2", 60);
    expect(store.get("a")).toBeNull();
    expect(store.get("b")).toBe("2");

    // A negative TTL is clamped to 0 — expired, not immortal.
    store.set("c", "3", -10);
    expect(store.get("c")).toBeNull();
  });
});
