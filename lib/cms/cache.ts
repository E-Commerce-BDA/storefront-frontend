/**
 * Bounded TTL cache — sf-050
 *
 * The storefront has no Redis client and is not getting one (AGENTS.md §1:
 * this repo owns UI + thin seams). What it does have is a process that may
 * serve many requests between a CMS edit and the next revalidation, so the
 * fallback for "cms-svc just went down" is a small in-process map with a cap.
 *
 * Bounded on purpose: an unbounded map keyed by page key is a memory leak with
 * a friendly name. 32 entries covers every page this app renders, and the
 * eviction order (insertion) is the cheapest thing that is still correct —
 * a true LRU would need a second bookkeeping structure for no measurable win
 * at this size.
 *
 * Generic over the entry shape so the same module serves page settings and
 * navigation; `TtlCache<AuthSettingsEntry>` is structurally the existing
 * injected `AuthSettingsCache`.
 */

export interface TtlCache<T> {
  get(key: string): T | null;
  set(key: string, value: T, ttlSeconds: number): void;
}

export interface MemoryCacheOptions {
  /** Default 32. */
  maxEntries?: number;
  now?: () => number;
}

export const MEMORY_CACHE_MAX_ENTRIES = 32;

interface Stored<T> {
  value: T;
  expiresAt: number;
}

export function createMemoryCache<T>(options: MemoryCacheOptions = {}): TtlCache<T> {
  const maxEntries = Math.max(1, options.maxEntries ?? MEMORY_CACHE_MAX_ENTRIES);
  const now = options.now ?? Date.now;
  const store = new Map<string, Stored<T>>();

  return {
    get(key) {
      const hit = store.get(key);
      if (!hit) return null;
      if (hit.expiresAt <= now()) {
        store.delete(key);
        return null;
      }
      return hit.value;
    },

    set(key, value, ttlSeconds) {
      // Re-inserting moves the key to the end of the eviction order: a page
      // that is still being read should not be the first one dropped.
      store.delete(key);
      store.set(key, { value, expiresAt: now() + Math.max(0, ttlSeconds) * 1000 });
      while (store.size > maxEntries) {
        const oldest = store.keys().next();
        if (oldest.done) break;
        store.delete(oldest.value);
      }
    },
  };
}
