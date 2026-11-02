"use client";

import { bff } from "@/lib/http/browser";
import type { ServiceResult } from "@/lib/http/result";
import {
  hydratedWishlistResponseSchema,
  wishlistItemResponseSchema,
  type HydratedWishlistResponse,
  type WishlistItemResponseDto,
} from "./schemas";

export async function fetchWishlist(): Promise<ServiceResult<HydratedWishlistResponse>> {
  return bff<HydratedWishlistResponse>("/api/wishlist", {
    method: "GET",
    schema: hydratedWishlistResponseSchema,
  });
}

export async function postWishlistItem(
  productId: string,
): Promise<ServiceResult<WishlistItemResponseDto>> {
  return bff<WishlistItemResponseDto>("/api/wishlist/items", {
    method: "POST",
    body: { productId },
    schema: wishlistItemResponseSchema,
  });
}

export async function deleteWishlistItem(itemId: string): Promise<ServiceResult<void>> {
  return bff<void>(`/api/wishlist/items/${encodeURIComponent(itemId)}`, {
    method: "DELETE",
  });
}

export async function postConsumePending(): Promise<ServiceResult<{ consumed: boolean; productId?: string }>> {
  return bff<{ consumed: boolean; productId?: string }>("/api/wishlist/consume-pending", {
    method: "POST",
  });
}

