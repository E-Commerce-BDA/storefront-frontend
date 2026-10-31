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

/** `null` means signed in; anything else is a code the UI has copy for. */
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

async function readCode(response: Response): Promise<AuthErrorCode | null> {
  try {
    const body = (await response.json()) as { error?: { code?: unknown } };
    const code = body?.error?.code;
    return isAuthErrorCode(code) ? code : null;
  } catch {
    return null;
  }
}
