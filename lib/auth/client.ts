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
 * Refresh failures carry a domain code from auth-svc (`TOKEN_REUSED`,
 * `ACCOUNT_DISABLED`) in the shared error envelope. Status stays the stable
 * half of the contract; a 401 with no known code is simply `TOKEN_EXPIRED`.
 * No message is ever parsed — copy can change without breaking the mapping.
 */

import { serviceUrl } from "@/lib/services/urls";
import { isAuthErrorCode, type AuthErrorCode } from "./errors";

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
  /** I-03: service message/details survive so a BFF can surface them honestly. */
  message?: string;
  details?: unknown;
  retryAfter?: number;
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

/** sf-059: account-depth inputs, mirroring auth-svc's DTOs (all optional names). */
export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface AccountAddressInput {
  type?: string;
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country?: string;
  isDefault?: boolean;
}

export interface AccountAddressDto extends AccountAddressInput {
  id: string;
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
  /** au-007: forgot returns the same generic message for every address. */
  forgotPassword(email: string): Promise<AuthResult<{ message: string }>>;
  resetPassword(token: string, newPassword: string): Promise<AuthResult<null>>;
  updateProfile(accessToken: string, input: UpdateProfileInput): Promise<AuthResult<AuthUser>>;
  changePassword(accessToken: string, input: ChangePasswordInput): Promise<AuthResult<null>>;
  listAddresses(accessToken: string): Promise<AuthResult<AccountAddressDto[]>>;
  createAddress(accessToken: string, input: AccountAddressInput): Promise<AuthResult<AccountAddressDto>>;
  updateAddress(accessToken: string, id: string, input: Partial<AccountAddressInput>): Promise<AuthResult<AccountAddressDto>>;
  deleteAddress(accessToken: string, id: string): Promise<AuthResult<null>>;
}

type Operation =
  | "login"
  | "register"
  | "refresh"
  | "logout"
  | "me"
  | "forgotPassword"
  | "resetPassword"
  | "updateProfile"
  | "changePassword"
  | "addresses";

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
      return authFailure(response, operation);
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
      return authFailure(response, operation);
    }

    try {
      return { ok: true, data: await response.json() };
    } catch {
      return { ok: false, code: "SERVICE_UNAVAILABLE", status: response.status };
    }
  }

  /**
   * Authenticated writes. Same failure vocabulary as `get`; the Bearer is
   * attached here and nowhere downstream, so an island can never see it.
   */
  async function write(
    method: "PATCH" | "POST" | "DELETE",
    path: string,
    accessToken: string,
    body: unknown,
    operation: Operation,
  ): Promise<AuthResult<unknown>> {
    let response: Response;
    try {
      response = await fetchFn(`${baseUrl}${path}`, {
        method,
        headers: {
          accept: "application/json",
          authorization: `Bearer ${accessToken}`,
          ...(body === undefined ? {} : { "content-type": "application/json" }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        signal: AbortSignal.timeout(timeoutMs),
        cache: "no-store",
      });
    } catch {
      return { ok: false, code: "SERVICE_UNAVAILABLE", status: 0 };
    }
    if (!response.ok) {
      return authFailure(response, operation);
    }
    if (response.status === 204) return { ok: true, data: null };
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

    async forgotPassword(email) {
      const result = await post(
        "/api/v1/auth/password/forgot",
        { email },
        "forgotPassword",
      );
      if (!result.ok) return result;
      const message = isRecord(result.data) ? result.data.message : undefined;
      return typeof message === "string"
        ? { ok: true, data: { message } }
        : { ok: false, code: "SERVICE_UNAVAILABLE", status: 200 };
    },

    async resetPassword(token, newPassword) {
      const result = await post(
        "/api/v1/auth/password/reset",
        { token, newPassword },
        "resetPassword",
      );
      return result.ok ? { ok: true, data: null } : result;
    },

    async updateProfile(accessToken, input) {
      const result = await write("PATCH", "/api/v1/auth/me", accessToken, input, "updateProfile");
      if (!result.ok) return result;
      const user = asUser(isRecord(result.data) ? result.data.user : result.data);
      if (user === null) return { ok: false, code: "SERVICE_UNAVAILABLE", status: 200 };
      return { ok: true, data: user };
    },

    async changePassword(accessToken, input) {
      const result = await write(
        "PATCH",
        "/api/v1/auth/me/password",
        accessToken,
        input,
        "changePassword",
      );
      return result.ok ? { ok: true, data: null } : result;
    },

    async listAddresses(accessToken) {
      const result = await get("/api/v1/auth/me/addresses", accessToken, "addresses");
      if (!result.ok) return result;
      const raw = Array.isArray(result.data)
        ? result.data
        : isRecord(result.data) && Array.isArray(result.data.addresses)
          ? result.data.addresses
          : null;
      if (raw === null) return { ok: false, code: "SERVICE_UNAVAILABLE", status: 200 };
      return { ok: true, data: raw.filter(isAddress) };
    },

    async createAddress(accessToken, input) {
      const result = await write("POST", "/api/v1/auth/me/addresses", accessToken, input, "addresses");
      if (!result.ok) return result;
      const raw = unwrapAddress(result.data);
      return raw === null
        ? { ok: false, code: "SERVICE_UNAVAILABLE", status: 200 }
        : { ok: true, data: raw };
    },

    async updateAddress(accessToken, id, input) {
      const result = await write(
        "PATCH",
        `/api/v1/auth/me/addresses/${encodeURIComponent(id)}`,
        accessToken,
        input,
        "addresses",
      );
      if (!result.ok) return result;
      const raw = unwrapAddress(result.data);
      return raw === null
        ? { ok: false, code: "SERVICE_UNAVAILABLE", status: 200 }
        : { ok: true, data: raw };
    },

    async deleteAddress(accessToken, id) {
      const result = await write(
        "DELETE",
        `/api/v1/auth/me/addresses/${encodeURIComponent(id)}`,
        accessToken,
        undefined,
        "addresses",
      );
      return result.ok ? { ok: true, data: null } : result;
    },
  };
}

/** I-03/I-05: read the full error envelope, not just the code. */
async function authFailure(response: Response, operation: Operation): Promise<AuthFailure> {
  let code = "";
  let message: string | undefined;
  let details: unknown;
  try {
    const body: unknown = await response.json();
    if (typeof body === "object" && body !== null && "error" in body) {
      const envelope = (body as { error: unknown }).error;
      if (typeof envelope === "object" && envelope !== null) {
        const error = envelope as Record<string, unknown>;
        if (typeof error.code === "string") code = error.code;
        if (typeof error.message === "string") message = error.message;
        if ("details" in error) details = error.details;
      }
    }
  } catch {
    // A body that is not JSON still has a status; copy can fall back to code.
  }
  return {
    ok: false,
    code: classify(response.status, code, operation),
    status: response.status,
    ...(message === undefined ? {} : { message }),
    ...(details === undefined ? {} : { details }),
    ...(response.status === 429 || response.status === 503
      ? { retryAfter: readRetryAfter(response.headers.get("retry-after")) }
      : {}),
  };
}

/**
 * I-04: a known domain code wins over the status class — status alone rewrote
 * `RESET_TOKEN_EXPIRED` (a 401) into generic `TOKEN_EXPIRED`. Login/register
 * stay generic on purpose: distinguishing "disabled" there is a user
 * enumeration oracle (errors.ts pins the same rule).
 */
function classify(
  status: number,
  code: string,
  operation: Operation,
): AuthErrorCode {
  const generic = operation === "login" || operation === "register";
  if (!generic && isAuthErrorCode(code)) {
    // Codes whose meaning already names the failure are never reclassified by
    // the status bucket they arrived in.
    if (
      code === "TOKEN_REUSED" ||
      code === "ACCOUNT_DISABLED" ||
      code === "RESET_TOKEN_INVALID" ||
      code === "RESET_TOKEN_EXPIRED" ||
      code === "EMAIL_TAKEN" ||
      code === "RATE_LIMITED"
    ) {
      return code;
    }
  }
  if (status === 409) return "EMAIL_TAKEN";
  if (status === 429) return "RATE_LIMITED";
  if (status === 401) {
    if (generic) return "INVALID_CREDENTIALS";
    return "TOKEN_EXPIRED";
  }
  if (status >= 500) return "SERVICE_UNAVAILABLE";
  return "VALIDATION_FAILED";
}

function readRetryAfter(value: string | null): number | undefined {
  if (value === null || value.trim() === "") return undefined;
  const seconds = Number(value.trim());
  return Number.isFinite(seconds) && seconds >= 0 ? Math.floor(seconds) : undefined;
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

function isAddress(value: unknown): value is AccountAddressDto {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.line1 === "string" &&
    typeof value.city === "string" &&
    typeof value.postalCode === "string"
  );
}

/** auth-svc wraps a single address in `{ address }`; a list is unwrapped above. */
function unwrapAddress(value: unknown): AccountAddressDto | null {
  const candidate = isRecord(value) && "address" in value ? value.address : value;
  return isAddress(candidate) ? candidate : null;
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
