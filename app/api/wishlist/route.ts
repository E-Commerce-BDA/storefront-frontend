import type { NextRequest, NextResponse } from "next/server";
import { apiError, jsonNoStore, toResponse, unauthenticated } from "@/lib/bff/handler";
import { catalogClient } from "@/lib/catalog/client";
import { identityHeaders, readIdentity } from "@/lib/session/identity";
import { wishlistClient } from "@/lib/wishlist/client";
import type { HydratedWishlistEntry } from "@/lib/wishlist/schemas";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const identity = readIdentity(request.cookies);
  if (identity.accessToken === null) {
    return unauthenticated();
  }

  const result = await wishlistClient().getWishlist(identityHeaders(identity));
  if (!result.ok) {
    return toResponse(result);
  }

  const rawItems = result.data.items;
  if (rawItems.length === 0) {
    return jsonNoStore({ items: [] });
  }

  const ids = Array.from(new Set(rawItems.map((item) => item.productId)));
  const catalogRes = await catalogClient().listProducts({ ids });
  const products = catalogRes.ok ? catalogRes.data.items : [];
  const productMap = new Map(products.map((p) => [p.id, p]));

  const hydrated: HydratedWishlistEntry[] = [];
  for (const item of rawItems) {
    const product = productMap.get(item.productId);
    // Exclude archived/draft or missing products
    if (product && product.status === "active") {
      hydrated.push({
        id: item.id,
        productId: item.productId,
        addedAt: item.addedAt,
        product,
      });
    }
  }

  return jsonNoStore({ items: hydrated });
}

