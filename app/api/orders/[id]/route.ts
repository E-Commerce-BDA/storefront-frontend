/**
 * GET /api/orders/[id] — BFF handler (sf-051)
 *
 * The confirmation page's only data source. order-svc already answers 404 for
 * an order that is not the caller's (owner-or-admin check), so there is no
 * authorisation logic here to get wrong — the Bearer does the work and the
 * 404 is forwarded as-is. That also means a guessed id reveals nothing: the
 * same 404 covers "does not exist" and "not yours".
 */

import type { NextRequest, NextResponse } from "next/server";
import { toResponse, unauthenticated } from "@/lib/bff/handler";
import { orderClient } from "@/lib/order/client";
import { identityHeaders, readIdentity } from "@/lib/session/identity";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const identity = readIdentity(request.cookies);
  if (identity.accessToken === null) return unauthenticated();

  const { id } = await context.params;
  return toResponse(await orderClient().getOrder(identityHeaders(identity), id));
}
