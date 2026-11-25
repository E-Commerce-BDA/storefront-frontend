/**
 * Server transport — sf-051
 * (1.Architecture.md §6.7)
 *
 * The one place a server-side `fetch` to a backend happens. Domain clients
 * (`lib/catalog/client.ts`, `lib/cart/client.ts`, `lib/order/client.ts`) are
 * three thin method tables over `createServiceClient(name)`; they never build a
 * URL, a header, or a timeout themselves.
 *
 * What it does, every call:
 *   base URL from the registry → path + encoded query → json body →
 *   `AbortSignal.timeout(serviceTimeout(name))` → parse → validate → map.
 *
 * Three properties the callers rely on, all enforced here:
 *
 * - **Never throws.** A shopper must see a page, not a 500 with a stack trace.
 *   Network, DNS, timeout, non-JSON body, wrong shape: every one is a
 *   `ServiceResult`. Callers switch on `ok`, never `try`.
 * - **No retries.** A retry is the caller's decision, because only the caller
 *   knows whether a repeat is safe: checkout owns its idempotency key, cart owns
 *   cart-svc's interceptor, and a silent GET retry would hide latency from the
 *   page it is supposed to render.
 * - **No blind casts.** When a schema is given the success body either matches
 *   or the call fails as `CONTRACT_MISMATCH`. A schema that quietly drifts from
 *   the service turns a wrong field into wrong money on a confirmation page.
 *
 * The AbortSignal is caller-overridable so a page can widen or share a budget;
 * the default is per service from the registry (registry, not caller, because
 * one page's arbitrary 30 s would pin a lambda until timeout).
 */

import {
  encodeQuery,
  readFailure,
  readSuccess,
  type Perform,
  type RequestOptions,
  type ServiceResult,
} from "@/lib/http/result";
import { serviceTimeout, serviceUrl, type ServiceName } from "@/lib/services/urls";

export interface ServiceClientOverrides {
  baseUrl?: string;
  fetchFn?: typeof fetch;
  timeoutMs?: number;
}

export function createServiceClient(
  name: ServiceName,
  overrides: ServiceClientOverrides = {},
): Perform {
  const baseUrl = (overrides.baseUrl ?? serviceUrl(name)).replace(/\/+$/, "");
  const fetchFn = overrides.fetchFn ?? fetch;

  return async function perform<T>(
    request: RequestOptions<T>,
  ): Promise<ServiceResult<T>> {
    const method = request.method ?? "GET";
    const url = `${baseUrl}${request.path}${encodeQuery(request.query)}`;
    const timeoutMs = overrides.timeoutMs ?? serviceTimeout(name);

    const headers: Record<string, string> = {
      accept: "application/json",
      ...request.headers,
    };

    const init: RequestInit & { next?: { revalidate: number; tags?: string[] } } = {
      method,
      headers,
      signal: request.signal ?? AbortSignal.timeout(timeoutMs),
    };

    if (request.body !== undefined) {
      headers["content-type"] = "application/json";
      init.body = JSON.stringify(request.body);
    }

    if (request.cache === "no-store") {
      init.cache = "no-store";
    } else if (request.cache) {
      init.next = {
        revalidate: request.cache.revalidate,
        ...(request.cache.tags?.length ? { tags: request.cache.tags } : {}),
      };
    }

    let response: Response;
    try {
      response = await fetchFn(url, init);
    } catch (error) {
      const timedOut = isTimeout(error);
      return {
        ok: false,
        kind: "unavailable",
        status: 0,
        code: timedOut ? "TIMEOUT" : "NETWORK_ERROR",
        message: timedOut
          ? `${name} did not answer within ${timeoutMs} ms`
          : `${name} is unreachable`,
      };
    }

    if (!response.ok) return readFailure(response);
    return readSuccess(response, request.schema);
  };
}

function isTimeout(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "TimeoutError" || error.name === "AbortError")
  );
}
