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

/** Preview token for draft/inactive CMS reads; invalid tokens are ignored by cms-svc. */
export function previewTokenFrom(request: NextRequest): string | null {
  const fromHeader = request.headers.get("x-preview-token");
  if (fromHeader !== null && fromHeader.trim() !== "") return fromHeader.trim();
  return request.nextUrl.searchParams.get("preview");
}
