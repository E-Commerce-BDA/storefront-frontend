/**
 * Guest → user cart merge — sf-051 (A4.6)
 *
 * Called from the login and register handlers, **after** the session cookies
 * are set, because it is the new access token that authorises the merge while
 * the old guest id names the cart to absorb.
 *
 * Why here and not in the browser: A4.6 says the browser never merges. A client
 * call would need the guest id in JavaScript (it is HttpOnly) and would race
 * every other island on the page. The handler already holds both values.
 *
 * Two guardrails:
 *
 * - **1.5 s budget.** Sign-in must not fail because cart-svc is slow. A merge
 *   that misses its window leaves the guest cart intact — nothing is lost, and
 *   the shopper lands signed in with an empty user cart instead of an error.
 * - **Never throws.** A merge failure is logged and ignored; the response is
 *   already successful and the cookies are already set. Turning this into a 5xx
 *   would mean "your password was right but you cannot sign in", which is worse
 *   than a stale basket.
 */

import { cartClient, type CartClient } from "@/lib/cart/client";

export const MERGE_TIMEOUT_MS = 1500;

export interface MergeOptions {
  accessToken: string;
  guestSessionId: string | null;
  client?: CartClient;
  timeoutMs?: number;
}

export async function mergeGuestCart(options: MergeOptions): Promise<boolean> {
  const { accessToken, guestSessionId } = options;
  if (guestSessionId === null) return false;

  const client = options.client ?? cartClient();
  const timeoutMs = options.timeoutMs ?? MERGE_TIMEOUT_MS;

  try {
    const result = await client.merge(
      {
        authorization: `Bearer ${accessToken}`,
        "x-session-id": guestSessionId,
      },
      { signal: AbortSignal.timeout(timeoutMs) },
    );

    if (!result.ok) {
      // reason: no logger in this repo yet; a deliberately ignored failure still
      // has to be observable, and this is the only channel available in the
      // request path. It never reaches the shopper.
      console.warn(
        `[cart] guest merge failed (${result.status} ${result.code ?? "unknown"}): ${
          result.message ?? "no message"
        }`,
      );
      return false;
    }
    return true;
  } catch (error) {
    // reason: same as above — the transport does not throw, but a bad
    // `AbortSignal.timeout` argument or an injected client could.
    console.warn(`[cart] guest merge threw: ${(error as Error).message}`);
    return false;
  }
}
