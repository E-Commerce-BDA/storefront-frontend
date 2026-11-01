"use client";

/**
 * Browser transport — sf-051
 * (1.Architecture.md §6.7)
 *
 * Islands never call a service; they call **this origin** (`app/api/**`) and
 * this module is the only place that does. Same failure shape as the server
 * transport, so an island switches on `kind`/`code` exactly the way a handler
 * does — one vocabulary on both sides of the BFF.
 *
 * Two behaviours are baked in because getting them wrong costs money or a
 * session, and an island author should never have to remember either:
 *
 * 1. **The idempotency key is minted before the first attempt and reused on
 *    the 401 replay.** A refresh-then-replay that minted a second key would
 *    double-add an item or place a second order — the retry must look like the
 *    same logical mutation to cart-svc and order-svc, because it *is* one.
 * 2. **401 refreshes are single-flight.** Parallel refreshes would present the
 *    same refresh token twice; auth-svc treats that as `TOKEN_REUSED` and kills
 *    the session. So every failing call awaits one module-level promise, and
 *    every one of them replays after it resolves.
 *
 * Replay is attempted exactly once. A second 401 means the session is really
 * gone: the failure is returned and the caller routes to `/signin?next=…`.
 */

import {
  readFailure,
  readSuccess,
  type ServiceResult,
} from "@/lib/http/result";
import type { ZodType } from "zod";

type Method = "GET" | "POST" | "PATCH" | "DELETE";

export interface BffOptions<T> {
  method?: Method;
  body?: unknown;
  /**
   * Reuse a key across retries of one logical mutation (checkout keeps a key
   * per canonical body). Absent → minted here, so a plain add-to-cart is safe
   * by default.
   */
  idempotencyKey?: string;
  schema?: ZodType<T>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

const REFRESH_PATH = "/api/auth/refresh";

/** Module-level so concurrent 401s share one refresh. */
let refreshing: Promise<boolean> | null = null;

/**
 * Single-flight session refresh. Exported so an island can warm the session
 * before a burst of writes instead of discovering the 401 per request.
 */
export function refreshSession(): Promise<boolean> {
  if (refreshing === null) {
    refreshing = postRefresh().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

async function postRefresh(): Promise<boolean> {
  try {
    const response = await fetch(REFRESH_PATH, {
      method: "POST",
      headers: { accept: "application/json" },
      // The refresh cookie is HttpOnly; the browser attaches it, we never see it.
      credentials: "same-origin",
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function bff<T>(
  path: string,
  options: BffOptions<T> = {},
): Promise<ServiceResult<T>> {
  const method: Method = options.method ?? "GET";
  const mutating = method !== "GET";
  const key =
    options.idempotencyKey ?? (mutating ? crypto.randomUUID() : undefined);

  const first = await send(path, method, key, options);
  if (first.ok || first.kind !== "unauthorized") return first;

  // 401 — one shared refresh, then one replay with the *same* key.
  const refreshed = await refreshSession();
  if (!refreshed) return first;

  return send(path, method, key, options);
}

async function send<T>(
  path: string,
  method: Method,
  key: string | undefined,
  options: BffOptions<T>,
): Promise<ServiceResult<T>> {
  const headers: Record<string, string> = {
    accept: "application/json",
    ...options.headers,
  };
  if (key !== undefined) headers["x-idempotency-key"] = key;

  const init: RequestInit = {
    method,
    headers,
    // The session lives in HttpOnly cookies — same-origin or they are not sent.
    credentials: "same-origin",
  };
  if (options.body !== undefined) {
    headers["content-type"] = "application/json";
    init.body = JSON.stringify(options.body);
  }
  if (options.signal) init.signal = options.signal;

  let response: Response;
  try {
    response = await fetch(path, init);
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    return {
      ok: false,
      kind: "unavailable",
      status: 0,
      code: aborted ? "ABORTED" : "NETWORK_ERROR",
      message: aborted ? "request cancelled" : "network unreachable",
    };
  }

  if (!response.ok) return readFailure(response);
  return readSuccess(response, options.schema);
}
