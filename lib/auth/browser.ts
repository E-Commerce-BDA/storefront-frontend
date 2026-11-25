/**
 * Browser-side auth submit — sf-049
 *
 * The only auth module a client island imports. It talks to *our own* BFF
 * (`/api/auth/*`), never to auth-svc, and it reads exactly one field out of
 * the response: `error.code`. Everything else — tokens included — stays on
 * the server, because the handlers put the pair in HttpOnly cookies.
 *
 * Never throws: a network failure is `SERVICE_UNAVAILABLE`, the same code the
 * handlers use when auth-svc is unreachable, so `displayFor` has one path.
 */

import { isAuthErrorCode, type AuthErrorCode } from "./errors";

export async function submitAuth(
  path: string,
  body: unknown,
): Promise<AuthErrorCode | null> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch {
    return "SERVICE_UNAVAILABLE";
  }

  if (response.ok) return null;
  return (await readCode(response)) ?? "SERVICE_UNAVAILABLE";
}

/**
 * Same seam as submitAuth for the one flow that needs a success message:
 * forgot-password's generic answer. Reading only `message` keeps the token
 * (which auth-svc never returns anyway) out of the island's vocabulary.
 */
export async function submitAuthMessage(
  path: string,
  body: unknown,
): Promise<{ code: AuthErrorCode | null; message: string | null }> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return { code: "SERVICE_UNAVAILABLE", message: null };
  }
  if (!response.ok) return { code: await readCode(response), message: null };
  const payload = (await response.json().catch(() => null)) as { message?: unknown } | null;
  return {
    code: null,
    message: typeof payload?.message === "string" ? payload.message : null,
  };
}

async function readCode(response: Response): Promise<AuthErrorCode | null> {
  try {
    const body = (await response.json()) as { error?: { code?: unknown } };
    const code = body?.error?.code;
    return isAuthErrorCode(code) ? code : null;
  } catch {
    return null;
  }
}
