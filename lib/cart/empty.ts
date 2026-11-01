/**
 * The empty cart — sf-051
 *
 * `GET /api/cart` has to answer something before the shopper has an identity
 * (first visit, no `sf_cid` propagated yet), and cart-svc would answer 401.
 * An empty cart is the honest 200: the drawer renders, the count is 0, and no
 * island has to special-case "no answer".
 *
 * `cart: null` is deliberate and typed as such — there is no cart row yet, and
 * pretending otherwise would force every consumer to narrow a fake id. The
 * zeros live here rather than at the call site so the three places that show
 * them cannot drift apart.
 *
 * A function, not a frozen object: `items` is an array, and one shared mutable
 * array would leak lines between renders in a server process.
 */

import type { CartItemDto, CartTotalsDto } from "@/lib/cart/schemas";

export interface EmptyCart {
  cart: null;
  items: CartItemDto[];
  totals: CartTotalsDto;
}

export function emptyCart(): EmptyCart {
  return {
    cart: null,
    items: [],
    totals: { subtotal: 0, itemCount: 0, lineCount: 0 },
  };
}
