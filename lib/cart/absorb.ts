// ADR-sessions: merge then rotate guest id (see Documentation/ARCHITECTURE_DECISIONS.md)

import type { NextRequest, NextResponse } from "next/server";
import { isSecureCookie, readCookie } from "@/lib/auth/session";
import { mergeGuestCart } from "@/lib/cart/merge";
import { GUEST_COOKIE, guestCookie, isGuestId, mintGuestId } from "@/lib/session/guest";

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
