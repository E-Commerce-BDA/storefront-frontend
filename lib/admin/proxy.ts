/**
 * Admin BFF forwarder — sf-077. Server-only.
 *
 * One place that turns an admin request into a service call. The admin app
 * talks only to this origin; the Bearer comes from the guard (never from the
 * browser) and the preview token is forwarded to cms-svc for draft/inactive
 * reads. cms-svc ignores invalid preview tokens, so none of this surfaces an
 * error to the caller that the caller did not already get from the service.
 */
import { encodeQuery, readFailure, readSuccess, type ServiceResult } from "@/lib/http/result";
import { serviceTimeout, serviceUrl, type ServiceName } from "@/lib/services/urls";
import type { NextRequest } from "next/server";
import type { AdminIdentity } from "./guard";

export interface ForwardOptions {
  service: ServiceName;
  path: string;
  identity: AdminIdentity;
  /** Read-only requests carry the preview token; writes never need it. */
  previewToken?: string | null;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Reuse the caller's JSON body for writes; reads pass undefined. */
  body?: unknown;
}

export async function forwardAdmin<T>(request: NextRequest, options: ForwardOptions): Promise<ServiceResult<T>> {
  const base = serviceUrl(options.service).replace(/\/+$/, "");
  const url = `${base}${options.path}`;
  const headers: Record<string, string> = {
    accept: "application/json",
    authorization: `Bearer ${options.identity.accessToken}`,
  };
  if (options.previewToken) headers["x-preview-token"] = options.previewToken;

  const method = options.method ?? "GET";
  const init: RequestInit & { next?: { revalidate: number } } = {
    method,
    headers,
    signal: AbortSignal.timeout(serviceTimeout(options.service)),
    cache: "no-store",
    // Admin reads must see the current state, never a prerendered cache.
    ...(method === "GET" ? { next: { revalidate: 0 } } : {}),
  };
  if (options.body !== undefined) {
    headers["content-type"] = "application/json";
    init.body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return {
      ok: false,
      kind: "unavailable",
      status: 0,
      code: timedOut ? "TIMEOUT" : "NETWORK_ERROR",
      message: timedOut ? `${options.service} timed out` : `${options.service} is unreachable`,
    };
  }
  if (!response.ok) return readFailure(response);
  // No schema is asserted here: admin responses are already contract-validated
  // by the services, and a strict storefront schema would reject newer admin
  // fields. The BFF forwards them verbatim (I-18 marker: body forwarded as-is).
  return readSuccess<T>(response);
}

/** Build a path with a safe query string from an allowlist of param names. */
export function adminQuery(
  request: NextRequest,
  allowed: readonly string[],
): string {
  const params = new URLSearchParams();
  for (const key of allowed) {
    const value = request.nextUrl.searchParams.get(key);
    if (value !== null && value !== "") params.set(key, value);
  }
  const encoded = encodeQuery(
    Object.fromEntries(params.entries()),
  );
  return encoded;
}
