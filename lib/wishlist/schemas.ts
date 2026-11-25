import { z } from "zod";
import { productListItemSchema } from "@/lib/catalog/schemas";

export const wishlistItemSchema = z
  .object({
    id: z.string(),
    productId: z.string(),
    addedAt: z.string(),
  })
  .loose();

export type WishlistItemDto = z.infer<typeof wishlistItemSchema>;

export const wishlistResponseSchema = z
  .object({
    items: z.array(wishlistItemSchema),
  })
  .loose();

export type WishlistResponseDto = z.infer<typeof wishlistResponseSchema>;

export const wishlistItemResponseSchema = z
  .object({
    item: wishlistItemSchema,
  })
  .loose();

export type WishlistItemResponseDto = z.infer<typeof wishlistItemResponseSchema>;

export const addWishlistItemPayloadSchema = z.object({
  productId: z.string().min(1),
});

export type AddWishlistItemPayload = z.infer<typeof addWishlistItemPayloadSchema>;

export const hydratedWishlistEntrySchema = z
  .object({
    id: z.string(),
    productId: z.string(),
    addedAt: z.string(),
    product: productListItemSchema,
  })
  .loose();

export type HydratedWishlistEntry = z.infer<typeof hydratedWishlistEntrySchema>;

export const hydratedWishlistResponseSchema = z
  .object({
    items: z.array(hydratedWishlistEntrySchema),
  })
  .loose();

export type HydratedWishlistResponse = z.infer<typeof hydratedWishlistResponseSchema>;

