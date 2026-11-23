/**
 * GET /api/account — BFF handler (sf-051)
 *
 * The account page needs two unrelated backends (auth-svc profile, order-svc
 * history), so this is the one handler that fans out. It runs both in parallel
 * and degrades **partially**: an order-svc outage must not blank the profile
 * header, and the shopper can still sign out and shop.
 *
 * - profile fails → the whole answer fails. Half an account page is not an
 *   account page, and the profile is what identifies the shopper.
 * - history fails → `200 { user, orders: [], ordersError }`. The island renders
 *   the header and an inline "your orders are unavailable right now".
 *
 * A guest (no access cookie) is a 401: the proxy already keeps them off
 * `/account`, so this only covers a direct call.
 */

import type { NextRequest, NextResponse } from "next/server";
import { authServiceUrl, createAuthClient } from "@/lib/auth/client";
import { apiError, jsonNoStore, unauthenticated } from "@/lib/bff/handler";
import { orderClient } from "@/lib/order/client";
import { identityHeaders, readIdentity } from "@/lib/session/identity";

const ORDER_PAGE_SIZE = 20;

export async function GET(request: NextRequest): Promise<NextResponse> {
  const identity = readIdentity(request.cookies);
  const { accessToken } = identity;
  if (accessToken === null) return unauthenticated();

  const [profile, history] = await Promise.all([
    createAuthClient({ baseUrl: authServiceUrl() }).me(accessToken),
    orderClient().listOrders(identityHeaders(identity), { limit: ORDER_PAGE_SIZE }),
  ]);

  if (!profile.ok) {
    return apiError(
      profile.status === 0 ? 503 : profile.status,
      profile.code,
    );
  }

  return jsonNoStore({
    user: profile.data,
    orders: history.ok ? history.data.orders : [],
    ordersError: history.ok
      ? null
      : { code: history.code ?? "SERVICE_UNAVAILABLE", status: history.status },
  });
}
