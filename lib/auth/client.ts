/**
 * Thin auth client — sf-049
 * (Documentation/pages/auth-design.md §92 · services/auth.md)
 *
 * Server-only. This is the *only* module in the storefront that ever holds an
 * `accessToken`/`refreshToken`, and it is imported by the four BFF route
 * handlers and by nothing that ships to the browser. The route handlers turn
 * the pair into HttpOnly cookies and reply with `{ user }` — so the token never
 * reaches JavaScript (AGENTS.md §2: one action per handler —
 * validate → forward → cookies).
 *
 * Pure and injected: `fetchFn` and the clock are the only inputs, the client
 * never throws, and every failure is a typed code the UI already has copy for.
 * That is what lets the tests run with zero network.
 *
 * WHY message-matching for refresh: auth-svc emits no domain codes yet
 * (`src/common/filters/http-exception.filter.ts` `defaultCode` returns
 * `UNAUTHENTICATED` for every 401), so "security violation" and "Account is
 * disabled" are only distinguishable by their message. The mapping is
 * deliberately narrow and is the one thing to delete when auth-svc grows
 * `TOKEN_REUSED`/`ACCOUNT_DISABLED` codes.
 */

import { serviceUrl } from "@/lib/services/urls";
import type { AuthErrorCode } from "./errors";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  roles: string[];
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export type AuthFailure = {
  ok: false;
  code: AuthErrorCode;
  status: number;
};

export type AuthResult<T> = { ok: true; data: T } | AuthFailure;

export interface CredentialsInput {
  email: string;
  password: string;
}

export interface RegisterInput extends CredentialsInput {
  firstName: string;
  lastName: string;
}

export interface AuthClient {
  login(input: CredentialsInput): Promise<AuthResult<AuthSession>>;
  register(input: RegisterInput): Promise<AuthResult<AuthSession>>;
  refresh(refreshToken: string): Promise<AuthResult<TokenPair>>;
  logout(refreshToken: string): Promise<AuthResult<null>>;
  /**
   * The caller's own profile. Used by `GET /api/account` (the account page
   * wants `firstName`/`email`, which no cookie carries) — sf-051.
   */
  me(accessToken: string): Promise<AuthResult<AuthUser>>;
}

type Operation = "login" | "register" | "refresh" | "logout" | "me";

export const AUTH_SERVICE_TIMEOUT_MS = 3000;

/**
 * Where auth-svc lives. Read at call time, not at module load, so a test can
 * set the variable before importing a handler. The literal `process.env.X` read
 * stays here because `proxy.ts` (edge runtime) shares this function and the
 * edge only inlines static references — the registry owns the rest.
 */
export function authServiceUrl(): string {
  return serviceUrl("auth", process.env.AUTH_SVC_URL);
}

export function createAuthClient(options: {
  baseUrl: string;
  fetchFn?: typeof fetch;
  timeoutMs?: number;
}): AuthClient {
  const baseUrl = options.baseUrl.replace(/\/+$/, "");
  const fetchFn = options.fetchFn ?? fetch;
  const timeoutMs = options.timeoutMs ?? AUTH_SERVICE_TIMEOUT_MS;

  async function post(
    path: string,
    body: unknown,
    operation: Operation,
  ): Promise<AuthResult<unknown>> {
    let response: Response;
    try {
      response = await fetchFn(`${baseUrl}${path}`, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch {
      return { ok: false, code: "SERVICE_UNAVAILABLE", status: 0 };
    }

    if (!response.ok) {
      return {
        ok: false,
        code: classify(response.status, await readMessage(response), operation),
        status: response.status,
      };
    }

    if (response.status === 204) return { ok: true, data: null };

    try {
      return { ok: true, data: await response.json() };
    } catch {
      return { ok: false, code: "SERVICE_UNAVAILABLE", status: response.status };
    }
  }

  async function get(
    path: string,
    accessToken: string,
    operation: Operation,
  ): Promise<AuthResult<unknown>> {
    let response: Response;
    try {
      response = await fetchFn(`${baseUrl}${path}`, {
        method: "GET",
        headers: {
          accept: "application/json",
          authorization: `Bearer ${accessToken}`,
        },
        signal: AbortSignal.timeout(timeoutMs),
        // A profile is private data; a cached one is somebody else's.
        cache: "no-store",
      });
    } catch {
      return { ok: false, code: "SERVICE_UNAVAILABLE", status: 0 };
    }

    if (!response.ok) {
      return {
        ok: false,
        code: classify(response.status, await readMessage(response), operation),
        status: response.status,
      };
    }

    try {
      return { ok: true, data: await response.json() };
    } catch {
      return { ok: false, code: "SERVICE_UNAVAILABLE", status: response.status };
    }
  }

  return {
    async login(input) {
      const result = await post("/api/v1/auth/login", input, "login");
      if (!result.ok) return result;
      const session = asSession(result.data);
      if (!session) return { ok: false, code: "SERVICE_UNAVAILABLE", status: 200 };
      return { ok: true, data: session };
    },

    async register(input) {
      // Step 1 — create the account. auth-svc returns { user } only; any
      // non-2xx is forwarded to the handler with the existing error taxonomy.
      const createResult = await post("/api/v1/auth/register", input, "register");
      if (!createResult.ok) return createResult;

      // Step 2 — authenticate. auth-svc does not issue tokens on register, so
      // the BFF logs in with the credentials the shopper just provided. A
      // failure here is a 503-equivalent (account exists but session didn't).
      const authResult = await post(
        "/api/v1/auth/login",
        { email: input.email, password: input.password },
        "register",
      );
      if (!authResult.ok) {
        return { ok: false, code: "SERVICE_UNAVAILABLE", status: 0 };
      }
      const session = asSession(authResult.data);
      if (!session) return { ok: false, code: "SERVICE_UNAVAILABLE", status: 200 };
      return { ok: true, data: session };
    },

    async refresh(refreshToken) {
      const result = await post(
        "/api/v1/auth/refresh",
        { refreshToken },
        "refresh",
      );
      if (!result.ok) return result;
      const pair = asTokenPair(result.data);
      if (!pair) return { ok: false, code: "SERVICE_UNAVAILABLE", status: 200 };
      return { ok: true, data: pair };
    },

    async logout(refreshToken) {
      const result = await post(
        "/api/v1/auth/logout",
        { refreshToken },
        "logout",
      );
      if (!result.ok) return result;
      return { ok: true, data: null };
    },

    async me(accessToken) {
      const result = await get("/api/v1/auth/me", accessToken, "me");
      if (!result.ok) return result;
      const user = asUser(isRecord(result.data) ? result.data.user : undefined);
      if (user === null) {
        return { ok: false, code: "SERVICE_UNAVAILABLE", status: 200 };
      }
      return { ok: true, data: user };
    },
  };
}

async function readMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: { message?: unknown } };
    const message = body?.error?.message;
    return typeof message === "string" ? message : "";
  } catch {
    return "";
  }
}

/**
 * Status first, because that is the stable half of auth-svc's contract.
 * Message only breaks the tie inside 401 on refresh.
 */
function classify(
  status: number,
  message: string,
  operation: Operation,
): AuthErrorCode {
  if (status === 409) return "EMAIL_TAKEN";
  if (status === 429) return "RATE_LIMITED";
  if (status === 401) {
    // Login stays generic on purpose: "account is disabled" is a user
    // enumeration oracle if the copy differs (errors.ts pins the same rule).
    if (operation === "login" || operation === "register") {
      return "INVALID_CREDENTIALS";
    }
    const lowered = message.toLowerCase();
    if (lowered.includes("security violation")) return "TOKEN_REUSED";
    if (lowered.includes("disabled")) return "ACCOUNT_DISABLED";
    return "TOKEN_EXPIRED";
  }
  if (status >= 500) return "SERVICE_UNAVAILABLE";
  return "VALIDATION_FAILED";
}

function asSession(value: unknown): AuthSession | null {
  if (!isRecord(value)) return null;
  const user = asUser(value.user);
  const accessToken = value.accessToken;
  const refreshToken = value.refreshToken;
  if (user === null) return null;
  if (typeof accessToken !== "string" || typeof refreshToken !== "string") {
    return null;
  }
  return { user, accessToken, refreshToken };
}

function asUser(value: unknown): AuthUser | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "string" || typeof value.email !== "string") return null;
  return {
    id: value.id,
    email: value.email,
    firstName: typeof value.firstName === "string" ? value.firstName : null,
    lastName: typeof value.lastName === "string" ? value.lastName : null,
    roles: Array.isArray(value.roles)
      ? value.roles.filter((role): role is string => typeof role === "string")
      : [],
  };
}

function asTokenPair(value: unknown): TokenPair | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.accessToken !== "string" ||
    typeof value.refreshToken !== "string"
  ) {
    return null;
  }
  return { accessToken: value.accessToken, refreshToken: value.refreshToken };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
