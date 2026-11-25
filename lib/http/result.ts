/**
 * Service result — sf-051
 * (1.Architecture.md §6.7)
 *
 * Every call to a backend returns this union. One shape means one switch: a
 * page asks `ok`, then reads `kind` for the retryable-or-terminal answer and
 * `code` for the upstream domain code (`STOCK_INSUFFICIENT`, …).
 *
 * This module is fetch-agnostic on purpose — it holds the vocabulary, the
 * status→kind table, and the two response readers. It imports nothing from
 * `lib/services`, so `lib/http/browser.ts` can depend on it without dragging
 * server env names into the client bundle.
 *
 * Decisions baked in here so no caller re-decides:
 * - `status: 0` means the request never reached the service (network, DNS,
 *   abort). Everything else is a real HTTP status.
 * - `TIMEOUT` and `CONTRACT_MISMATCH` are *our* codes, not the service's: the
 *   first says the budget expired, the second says the body failed its zod
 *   schema — the contract is wrong, so it is `upstream`, not `unavailable`
 *   (retrying a wrong contract just fails again, slowly).
 * - `502` is `upstream`: a service telling us our request shape is wrong. It
 *   must never be retried.
 * - `≥500` is `unavailable`: the service is having a day, a retry may help.
 */

import type { ZodType } from "zod";

export type FailureKind =
  | "unavailable"
  | "unauthorized"
  | "forbidden"
  | "not-found"
  | "invalid"
  | "conflict"
  | "rate-limited"
  | "upstream";

export interface ServiceFailure {
  ok: false;
  kind: FailureKind;
  status: number;
  code: string | null;
  message: string | null;
  /**
   * Structured error detail (ord-013's stock shortfall). Kept raw here because
   * this transport owns no domain schemas; the consuming island parses it.
   */
  details?: unknown;
}

export type ServiceResult<T> = { ok: true; data: T } | ServiceFailure;

export type Perform = <T>(req: RequestOptions<T>) => Promise<ServiceResult<T>>;

export interface RequestOptions<T> {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  path: string;
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
  schema?: ZodType<T>;
  /** `tags` are Next Data Cache tags (sf-061): a webhook can purge them by name. */
  cache?: { revalidate: number; tags?: string[] } | "no-store";
  signal?: AbortSignal;
}

export function kindForStatus(status: number): FailureKind {
  if (status === 0) return "unavailable";
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "not-found";
  if (status === 409) return "conflict";
  if (status === 429) return "rate-limited";
  if (status === 502) return "upstream";
  if (status >= 500) return "unavailable";
  return "invalid";
}

export function failure(
  status: number,
  code: string | null,
  message: string | null,
  details?: unknown,
): ServiceFailure {
  return {
    ok: false,
    kind: kindForStatus(status),
    status,
    code,
    message,
    ...(details === undefined ? {} : { details }),
  };
}

/**
 * A 200 whose body does not match the schema is `upstream`, never `invalid`:
 * the status says "fine", the shape says "our contract is wrong". Deriving the
 * kind from the status here would label it retryable, and a retry would fail
 * the same way at full latency.
 */
export function contractMismatch(status: number, message: string): ServiceFailure {
  return { ok: false, kind: "upstream", status, code: "CONTRACT_MISMATCH", message };
}

/**
 * Read the error envelope `{ error: { code, message } }`. Anything else (HTML
 * from a proxy, an empty body) falls back to the status text — a page must
 * still be able to say *something* useful.
 */
export async function readFailure(response: Response): Promise<ServiceFailure> {
  const status = response.status;
  let code: string | null = null;
  let message: string | null = null;
  let details: unknown;

  try {
    const body: unknown = await response.json();
    const envelope = isRecord(body) ? body.error : undefined;
    if (isRecord(envelope)) {
      if (typeof envelope.code === "string") code = envelope.code;
      if (typeof envelope.message === "string") message = envelope.message;
      if ("details" in envelope) details = envelope.details;
    }
  } catch {
  }

  if (message === null || message.length === 0) {
    message = response.statusText || `service returned ${status}`;
  }
  return failure(status, code, message, details);
}

/**
 * Read a success body, validating it against `schema` when given.
 * 204 → `data: undefined` (DELETE responses have no body by design).
 */
export async function readSuccess<T>(
  response: Response,
  schema?: ZodType<T>,
): Promise<ServiceResult<T>> {
  if (response.status === 204) return { ok: true, data: undefined as T };

  let raw: unknown;
  try {
    raw = await response.json();
  } catch {
    return contractMismatch(response.status, "response body is not JSON");
  }

  if (!schema) return { ok: true, data: raw as T };

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const where = first?.path.join(".") || "body";
    return contractMismatch(
      response.status,
      `${where}: ${first?.message ?? "failed validation"}`,
    );
  }
  return { ok: true, data: parsed.data };
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function encodeQuery(
  query: Record<string, string | number | boolean | null | undefined> | undefined,
): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const encoded = params.toString();
  return encoded.length > 0 ? `?${encoded}` : "";
}
