import { NextResponse, type NextRequest } from "next/server";
import { isSecureCookie } from "@/lib/auth/session";
import { jsonNoStore } from "@/lib/bff/handler";
import { identityHeaders, readIdentity } from "@/lib/session/identity";
import { wishlistClient } from "@/lib/wishlist/client";
import {
  clearPendingWishlistCookie,
  readPendingWishlist,
} from "@/lib/wishlist/pending";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const pendingProductId = readPendingWishlist(request.cookies);
  if (!pendingProductId) {
    return jsonNoStore({ consumed: false });
  }

  const identity = readIdentity(request.cookies);
  if (identity.accessToken === null) {
    return jsonNoStore({ consumed: false });
  }

  // Attempt to add the item to the user's wishlist
  await wishlistClient().addItem(identityHeaders(identity), pendingProductId);

  // Clear the cookie regardless of success so it isn't retried indefinitely
  const res = jsonNoStore({ consumed: true, productId: pendingProductId });
  res.cookies.set(clearPendingWishlistCookie({ secure: isSecureCookie() }));
  return res;
}

