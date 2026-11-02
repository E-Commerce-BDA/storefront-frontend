import { createServiceClient } from "@/lib/http/client";
import type { Perform, ServiceResult } from "@/lib/http/result";
import type { IdentityHeaders } from "@/lib/cart/client";
import {
  wishlistResponseSchema,
  wishlistItemResponseSchema,
  type WishlistResponseDto,
  type WishlistItemResponseDto,
} from "./schemas";

export interface WishlistClient {
  getWishlist(identity: IdentityHeaders): Promise<ServiceResult<WishlistResponseDto>>;
  addItem(identity: IdentityHeaders, productId: string): Promise<ServiceResult<WishlistItemResponseDto>>;
  removeItem(identity: IdentityHeaders, itemId: string): Promise<ServiceResult<void>>;
}

const BASE = "/api/v1/cart/wishlist";

export function createWishlistClient(perform: Perform): WishlistClient {
  return {
    getWishlist(identity) {
      return perform({
        method: "GET",
        path: BASE,
        headers: identity,
        schema: wishlistResponseSchema,
        cache: "no-store",
      });
    },

    addItem(identity, productId) {
      return perform({
        method: "POST",
        path: `${BASE}/items`,
        headers: identity,
        body: { productId },
        schema: wishlistItemResponseSchema,
        cache: "no-store",
      });
    },

    removeItem(identity, itemId) {
      return perform({
        method: "DELETE",
        path: `${BASE}/items/${encodeURIComponent(itemId)}`,
        headers: identity,
        cache: "no-store",
      });
    },
  };
}

export function wishlistClient(): WishlistClient {
  return createWishlistClient(createServiceClient("cart"));
}

