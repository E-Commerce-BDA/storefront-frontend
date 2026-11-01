/**
 * GET / DELETE /api/cart — BFF handler (sf-051)
 *
 * The cart's two collection-level verbs. One action each: read identity →
 * forward → respond.
 *
 * Two decisions worth the words:
 *
 * - **No identity is a 200 with an empty cart, not a 401.** A first visit has
 *   no `sf_cid` until the proxy's cookie reaches the browser, and a drawer that
 *   renders "0" is better than an island that has to special-case the error.
 *   cart-svc would 401; hiding that here is the whole point of a BFF.
 * - **DELETE without identity is a 204 no-op.** There is nothing to clear, and
 *   an error would make "empty my cart" look broken on a page with an empty
 *   cart on it.
 */

import type { NextRequest, NextResponse } from "next/server";
import {
  forbidden,
  idempotencyKey,
  jsonNoStore,
  noContent,
  sameOrigin,
  toResponse,
} from "@/lib/bff/handler";
import { cartClient } from "@/lib/cart/client";
import { emptyCart } from "@/lib/cart/state";
import { hasIdentity, identityHeaders, readIdentity } from "@/lib/session/identity";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const identity = readIdentity(request.cookies);
  if (!hasIdentity(identity)) {
    // Same zeros the client store starts from — one source, no drift.
    const { items, totals } = emptyCart();
    return jsonNoStore({ cart: null, items, totals });
  }

  return toResponse(await cartClient().getCart(identityHeaders(identity)));
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  if (!sameOrigin(request)) return forbidden();

  const identity = readIdentity(request.cookies);
  if (!hasIdentity(identity)) return noContent();

  const result = await cartClient().clear(identityHeaders(identity), {
    idempotencyKey: idempotencyKey(request),
  });
  return result.ok ? noContent() : toResponse(result);
}
