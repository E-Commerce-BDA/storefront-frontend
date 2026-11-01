/**
 * Absorb a guest cart into a fresh session — sf-051 (A4.6)
 *
 * The two-line call login and register both need: read `sf_cid` off the
 * request, merge it into the now-authenticated cart, then rotate the guest id.
 *
 * Everything that can go wrong here is non-fatal, which is why this takes the
 * already-built response instead of returning one: the shopper is signed in
 * either way, and only a successful merge may retire the guest id. Rotating on
 * a failed merge would leave items the shopper watched go into a basket nobody
 * can reach again.
 *
 * Why the rotation mints rather than clears: `sf_cid` is meant to exist on
 * every browser that can add to a cart. Clearing it hands the next page render
 * to the proxy's minting path; minting here costs nothing and makes the
 * post-login state identical to a first visit.
 */

import type { NextRequest, NextResponse } from "next/server";
import { isSecureCookie, readCookie } from "@/lib/auth/session";
import { mergeGuestCart } from "@/lib/cart/merge";
import { GUEST_COOKIE, guestCookie, isGuestId, mintGuestId } from "@/lib/session/guest";

/** True when a guest cart was merged and the id rotated. */
export async function absorbGuestCart(
  request: NextRequest,
  response: NextResponse,
  tokens: { accessToken: string },
): Promise<boolean> {
  const raw = readCookie(request.cookies, GUEST_COOKIE);
  // A malformed id would 400 the merge; treat it as "no guest cart".
  const guestSessionId = isGuestId(raw) ? raw : null;

  const merged = await mergeGuestCart({
    accessToken: tokens.accessToken,
    guestSessionId,
  });
  if (!merged) return false;

  response.cookies.set(guestCookie(mintGuestId(), { secure: isSecureCookie() }));
  return true;
}
