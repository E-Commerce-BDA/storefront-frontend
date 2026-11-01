/**
 * BFF handler kit — sf-051
 * (1.Architecture.md §6.7)
 *
 * Every handler under `app/api/(cart|checkout|orders|account)` is one action:
 * **validate → forward → respond**. This module is the validate and respond
 * halves, so the forwarding call is the only thing a handler body has to write.
 *
 * Three rules encoded once:
 *
 * - **`cache-control: no-store` on every response.** Cart, order and profile
 *   data is private; a cached copy is somebody else's data. The service client
 *   already refuses to cache upstream, and this is the browser/CDN half.
 * - **The failure body is the service envelope** `{ error: { code, message } }`,
 *   the same shape auth-svc, cart-svc and order-svc emit. An island parses one
 *   shape whether the failure came from us or from them.
 * - **`status: 0` becomes 503.** `status` is a real HTTP status on the wire;
 *   "never reached" has to be translated or the browser sees a 0-status
 *   response. The `code` (`TIMEOUT`, `NETWORK_ERROR`) is forwarded untouched so
 *   the island can tell "slow" from "down".
 *
 * `sameOrigin` is defence in depth, not the CSRF story: the cookies are
 * `SameSite=Lax`, so a cross-site POST does not carry them. It is here because
 * a cookie-authenticated write is worth two independent locks.
 */

import { NextResponse, type NextRequest } from "next/server";
import type { ServiceResult } from "@/lib/http/result";

const NO_STORE = { "cache-control": "no-store" } as const;

/** A 200 the handler composed itself (empty cart, partial account). */
export function jsonNoStore(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

/** A failure the handler composed itself (401, 403, 400). */
export function apiError(status: number, code: string, message?: string): NextResponse {
  const error: { code: string; message?: string } = { code };
  if (message !== undefined) error.message = message;
  return NextResponse.json({ error }, { status, headers: NO_STORE });
}

export function badRequest(code = "VALIDATION_FAILED"): NextResponse {
  return apiError(400, code);
}

export function unauthenticated(): NextResponse {
  return apiError(401, "UNAUTHENTICATED");
}

export function forbidden(): NextResponse {
  return apiError(403, "FORBIDDEN");
}

/** 204 — a DELETE that worked has nothing to say. */
export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204, headers: NO_STORE });
}

/**
 * Success → 200 with the payload (or `init.status`, for the one write that
 * creates a resource); failure → the upstream status and code. The one place a
 * service result becomes an HTTP response.
 */
export function toResponse<T>(
  result: ServiceResult<T>,
  init: { status?: number } = {},
): NextResponse {
  if (!result.ok) {
    return apiError(
      result.status === 0 ? 503 : result.status,
      result.code ?? "SERVICE_UNAVAILABLE",
      result.message ?? undefined,
    );
  }
  return jsonNoStore(result.data ?? null, init.status ?? 200);
}

/**
 * True when the request either carries no `Origin` (a same-origin fetch from an
 * older client, a server call, a curl) or carries one whose host matches ours.
 * A mismatch is a browser telling us the write came from another site.
 */
export function sameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (origin === null) return true;

  const host = request.headers.get("host");
  if (host === null) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    // `Origin: null` (sandboxed iframe, some redirects) — not us.
    return false;
  }
}

export async function readJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

/**
 * Checkout's key: order-svc keys its replay cache on this header, so a missing
 * key must be a 400 rather than something we invent — minting one here would
 * break the guarantee the shopper is relying on.
 */
export function requireIdempotencyKey(request: NextRequest): string | null {
  const key = request.headers.get("x-idempotency-key");
  return typeof key === "string" && key.trim().length > 0 ? key : null;
}

/**
 * Cart's key: cart-svc's `IdempotencyInterceptor` only demands that one exists.
 * The browser transport always sends one; this covers a caller that did not
 * (curl, a future native client) so the write still succeeds.
 */
export function idempotencyKey(request: NextRequest): string {
  return requireIdempotencyKey(request) ?? crypto.randomUUID();
}
