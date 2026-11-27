/**
 * Admin guard — sf-077. Server-only.
 *
 * The browser never sees a service token: the access token stays in the
 * HttpOnly `sf_at` cookie and is read from the request object, never from
 * `next/headers`. `me()` is the only authority on roles — a client could forge
 * any other header. Non-admin sessions get 403, guests 401.
 */
import { authServiceUrl, createAuthClient } from "@/lib/auth/client";
import { apiError, unauthenticated } from "@/lib/bff/handler";
import { PREVIEW_METADATA } from "@/lib/config/preview";
import { readIdentity } from "@/lib/session/identity";
import type { NextRequest, NextResponse } from "next/server";

export const ADMIN_ROLE = "admin";

export interface AdminIdentity {
  accessToken: string;
}

/**
 * Returns the token for an admin session, or a ready-made error response.
 * Exactly one of the two is non-null — callers never have to guess.
 */
export async function requireAdmin(
  request: NextRequest,
): Promise<{ identity: AdminIdentity; error: null } | { identity: null; error: NextResponse }> {
  const identity = readIdentity(request.cookies);
  if (identity.accessToken === null) return { identity: null, error: unauthenticated() };

  const me = await createAuthClient({ baseUrl: authServiceUrl() }).me(identity.accessToken);
  if (!me.ok) {
    return {
      identity: null,
      error: apiError(me.status === 0 ? 503 : me.status, me.code, me.message),
    };
  }
  if (!me.data.roles.some((role) => role.toLowerCase() === ADMIN_ROLE)) {
    return { identity: null, error: apiError(403, "FORBIDDEN", "Admin role required") };
  }
  return { identity: { accessToken: identity.accessToken }, error: null };
}

/**
 * The minimum shape shared by `Headers`, `NextRequest.headers` and
 * `URLSearchParams`. Keeping it structural lets the extraction stay pure and
 * usable from both route handlers and server components.
 */
export interface TokenSource {
  get(name: string): string | null | undefined;
}

/** `searchParams` on a Next 16 page (arrays are repeated query keys). */
export type PageSearchParams = Record<string, string | string[] | undefined>;

/**
 * One extraction rule for every public preview read. The header wins when both
 * are present: it is the channel a trusted proxy can set, while `?preview=` is
 * the iframe-friendly fallback. Both are trimmed so a whitespace-only value
 * never becomes a cache key.
 *
 * Rejected: reading the token in a client island — that would put it in the
 * browser bundle and defeat the scoped-token boundary.
 */
export function previewTokenFromSources(
  headers: TokenSource | null | undefined,
  query: TokenSource | null | undefined,
): string | null {
  const fromHeader = headers?.get(PREVIEW_METADATA.headerName);
  if (typeof fromHeader === "string" && fromHeader.trim() !== "") return fromHeader.trim();
  const fromQuery = query?.get(PREVIEW_METADATA.queryParam);
  if (typeof fromQuery === "string" && fromQuery.trim() !== "") return fromQuery.trim();
  return null;
}

/** Page-shaped adapter: Next hands `searchParams` as an object, not a URL. */
export function previewTokenFromPage(
  headers: TokenSource,
  searchParams: PageSearchParams,
): string | null {
  const raw = searchParams[PREVIEW_METADATA.queryParam];
  const value = Array.isArray(raw) ? raw[0] : raw;
  const query =
    typeof value === "string"
      ? new URLSearchParams([[PREVIEW_METADATA.queryParam, value]])
      : null;
  return previewTokenFromSources(headers, query);
}

/** Preview token for draft/inactive CMS reads; invalid tokens are ignored by cms-svc. */
export function previewTokenFrom(request: NextRequest): string | null {
  return previewTokenFromSources(request.headers, request.nextUrl.searchParams);
}
