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
import { catalogClient } from "@/lib/catalog/client";
import { hasIdentity, identityHeaders, readIdentity } from "@/lib/session/identity";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const identity = readIdentity(request.cookies);
  if (!hasIdentity(identity)) {
    // Same zeros the client store starts from — one source, no drift.
    const { items, totals } = emptyCart();
    return jsonNoStore({ cart: null, items, totals });
  }

  const result = await cartClient().getCart(identityHeaders(identity));
  if (!result.ok || result.data.items.length === 0) return toResponse(result);

  // sf-058: cart-svc deliberately stores no stock, so enrich our own answer
  // from catalog. The read is tagged and cached; a catalog outage leaves every
  // line uncapped (house ceiling) instead of breaking the cart.
  const ids = Array.from(new Set(result.data.items.map((item) => item.productId)));
  const catalog = await catalogClient().listProducts({ ids });
  const stockById = new Map(
    catalog.ok ? catalog.data.items.map((product) => [product.id, product.stock]) : [],
  );
  return jsonNoStore({
    ...result.data,
    items: result.data.items.map((item) => ({
      ...item,
      stock: stockById.get(item.productId) ?? null,
    })),
  });
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
