/**
 * Service registry — sf-051
 * (1.Architecture.md §6.7 · AGENTS.md §2)
 *
 * One row per backend. This is the *only* place a service URL literal lives:
 * adding a backend is one row here plus one line in `.env.example`, and no call
 * site changes. Everything else asks `serviceUrl(name)`.
 *
 * Two rules, both learned the hard way:
 *
 * 1. **Read at call time.** `process.env` is read inside the function, never at
 *    module load, so a `vi.stubEnv` before an import still wins and a container
 *    can be re-pointed without a rebuild. A module-level `const URL = ...`
 *    freezes whatever the first import saw — the classic 401-from-localhost bug.
 * 2. **Trailing slashes are stripped here.** Callers own path fragments only
 *    (`/api/v1/cart`); a base of `http://host/` must never become
 *    `http://host//api/v1/cart`, which some proxies 404 and some normalize.
 *
 * `CMS_BASE_URL` keeps its historic name while every other service follows
 * `<SERVICE>_SVC_URL`. Renaming it would churn two `.env` files and a test for
 * zero gain — the registry exists precisely so call sites never see the
 * asymmetry.
 */

export type ServiceName = "auth" | "cms" | "catalog" | "cart" | "order" | "search" | "analytics";

export interface ServiceDef {
  env: string;
  fallback: string;
  /** Per-request budget. A slow service is a slow render, not an exception. */
  timeoutMs: number;
}

export const SERVICES: Record<ServiceName, ServiceDef> = {
  auth: { env: "AUTH_SVC_URL", fallback: "http://localhost:4010", timeoutMs: 3000 },
  cms: { env: "CMS_BASE_URL", fallback: "http://localhost:4050", timeoutMs: 2000 },
  catalog: { env: "CATALOG_SVC_URL", fallback: "http://localhost:4020", timeoutMs: 2500 },
  cart: { env: "CART_SVC_URL", fallback: "http://localhost:4030", timeoutMs: 2500 },
  // Payment provider sits in this path; 2.5 s would abort healthy checkouts.
  order: { env: "ORDER_SVC_URL", fallback: "http://localhost:4040", timeoutMs: 8000 },
  search: { env: "SEARCH_SVC_URL", fallback: "http://localhost:4090", timeoutMs: 2000 },
  analytics: { env: "ANALYTICS_SVC_URL", fallback: "http://localhost:4060", timeoutMs: 2000 },
};

/**
 * Base URL for a service, without a trailing slash.
 *
 * Pass `configured` when the value must come from a *static* `process.env.X`
 * read: `process.env[SERVICES[name].env]` is a dynamic lookup, and the edge
 * runtime only inlines statically-analyzable env references. `proxy.ts` shares
 * `authServiceUrl()` with the Node BFF handlers, so that one caller passes the
 * literal expression and the registry still owns the fallback and the slash
 * trimming. Every Node-only client can omit it.
 */
export function serviceUrl(name: ServiceName, configured?: string): string {
  const value = configured !== undefined ? configured : process.env[SERVICES[name].env];
  const trimmed = value?.trim();
  const base = trimmed && trimmed.length > 0 ? trimmed : SERVICES[name].fallback;
  return base.replace(/\/+$/, "");
}

/** Per-request timeout in ms. A code constant, not env — budgets are reviewable. */
export function serviceTimeout(name: ServiceName): number {
  return SERVICES[name].timeoutMs;
}

export const SERVICE_NAMES = Object.keys(SERVICES) as ServiceName[];
