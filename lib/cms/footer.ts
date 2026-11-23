/**
 * Footer read — sf-062
 * (plan §7; `components/shell-cart.md` §5)
 *
 * The same cascade as `lib/cms/navigation.ts` — source → in-process stale cache
 * → fallback — with one deliberate difference: there is no builtin footer to
 * fall back to. `navigation` can render `DEMO_NAV_INPUT` because the navbar is
 * chrome and a demo link is a design decision; a footer's columns *are* content
 * (which pages exist, which contact is real), so inventing them would be the
 * thing this wave refuses. The fallback is therefore `null`, and
 * `components/shell/Footer.tsx` renders its documented minimal face — four links
 * that are all real routes.
 *
 * The stale layer still earns its keep: cms-svc going down after one successful
 * read should cost the site yesterday's footer, not the minimal shell. The Next
 * Data Cache (`cms:footer`, 300 s) is the cross-deploy layer; this map is the
 * within-process one.
 */

import type { Footer } from "@ecom/contracts";
import { createMemoryCache, type TtlCache } from "./cache";
import { cmsBaseUrl, createCmsClient, type CmsClient } from "./client";

export const FOOTER_CACHE_KEY = "footer";
export const FOOTER_CACHE_TTL_SECONDS = 300;

export interface FooterSource {
  fetchFooter(): Promise<Footer | null>;
}

export interface FetchFooterDeps {
  source?: FooterSource;
  cache?: TtlCache<Footer>;
  cacheTtlSeconds?: number;
}

export interface FooterResult {
  footer: Footer | null;
  stale: boolean;
  fallback: boolean;
}

/** Process-local stale store; survives between requests, resets on deploy. */
const footerCache = createMemoryCache<Footer>();

export function createCmsFooterSource(
  client: CmsClient = createCmsClient({ baseUrl: cmsBaseUrl() }),
): FooterSource {
  return {
    async fetchFooter(): Promise<Footer | null> {
      const response = await client.getFooter();
      return response === null ? null : response.footer;
    },
  };
}

/**
 * Never rejects. `client.getFooter()` already returns `null` on network,
 * timeout, non-2xx or a body the contracts schema refuses, so the only thing
 * left to catch here is a throwing cache — and a shell that can blank every
 * route in the app does not get to fail because of a map lookup.
 */
export async function fetchFooter(deps: FetchFooterDeps = {}): Promise<FooterResult> {
  const cache = deps.cache ?? footerCache;
  const source = deps.source ?? createCmsFooterSource();

  try {
    const fresh = await source.fetchFooter();
    if (fresh !== null) {
      cache.set(FOOTER_CACHE_KEY, fresh, deps.cacheTtlSeconds ?? FOOTER_CACHE_TTL_SECONDS);
      return { footer: fresh, stale: false, fallback: false };
    }
  } catch {
    // Source failure: fall through to the stale cache.
  }

  try {
    const cached = cache.get(FOOTER_CACHE_KEY);
    if (cached) return { footer: cached, stale: true, fallback: false };
  } catch {
    // Ignore — the minimal shell is a better answer than a 500.
  }

  return { footer: null, stale: false, fallback: true };
}
