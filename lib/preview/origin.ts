/**
 * Admin preview origin boundary — sf-096 follow-up. Pure.
 *
 * `postMessage` and `frame-ancestors` must agree on one exact origin. A string
 * that merely "contains" the admin host would also admit a lookalike port or
 * scheme, so both sides normalise through `new URL(...).origin`.
 *
 * Rejected: deriving the allowed origin from `event.origin` or from a browser
 * value — either would let any frame that can reach the preview send a draft.
 */

export const ADMIN_ORIGIN_ENV = "ADMIN_ORIGIN";
export const DEFAULT_ADMIN_ORIGIN = "http://localhost:3001";

/**
 * Returns a canonical `scheme://host[:port]` or null for an unusable value.
 * Callers decide whether to fail closed; never fall back to `*`.
 */
export function resolveAdminOrigin(raw: string | null | undefined): string | null {
  const value = raw !== null && raw !== undefined && raw.trim() !== "" ? raw.trim() : DEFAULT_ADMIN_ORIGIN;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (url.username !== "" || url.password !== "") return null;
    return url.origin;
  } catch {
    return null;
  }
}

/** Server-only env read; the client bridge receives the resolved string as a prop. */
export function adminOrigin(): string | null {
  return resolveAdminOrigin(process.env[ADMIN_ORIGIN_ENV]);
}
