/**
 * POST /api/track — the storefront's one analytics arrow (sf-052)
 *
 * The browser never talks to analytics-svc directly: it has no service URL and
 * no reason to know one exists. A client island sends a beacon to this origin;
 * this route validates it, adds the guest session id, and forwards it over HTTP.
 *
 * The answer is always 202. A tracking outage is not the shopper's problem, so
 * there is no retry and no error the UI could render. The client uses
 * sendBeacon, which the browser hands off and forgets, so navigation never
 * waits on this request either.
 */

import type { NextRequest, NextResponse } from "next/server";
import { analyticsClient, trackBeaconSchema } from "@/lib/analytics/client";
import { trackingAllowed, TRACK_OPTOUT_COOKIE } from "@/lib/analytics/consent";
import { badRequest, jsonNoStore } from "@/lib/bff/handler";
import { identityForWrite } from "@/lib/session/identity";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const parsed = trackBeaconSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest();

  const optout = request.cookies.get(TRACK_OPTOUT_COOKIE)?.value;
  if (!trackingAllowed({}, optout)) {
    return jsonNoStore({ status: "accepted" }, 202);
  }

  const { identity, minted } = identityForWrite(request.cookies);
  const response = jsonNoStore({ status: "accepted" }, 202);
  if (minted !== null) response.cookies.set(minted);

  if (identity.sessionId !== null) {
    // Fire-and-forget: the result is intentionally ignored so a down analytics
    // service cannot turn a page view into a failed request.
    await analyticsClient().track({ ...parsed.data, sessionId: identity.sessionId });
  }
  return response;
}
