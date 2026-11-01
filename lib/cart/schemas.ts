/**
 * Cart schemas — sf-051
 * (cart-svc `src/cart/cart.types.ts`, read from source)
 *
 * Loose objects, strict on the fields the cart UI renders. `unitPrice` is a
 * **number** here (cart-svc prices at write time and stores dollars), which is
 * why the cart never needs `toMoney()` — only order rows do.
 */

import { z } from "zod";

export const cartTotalsSchema = z
  .object({
    subtotal: z.number(),
    itemCount: z.number(),
    lineCount: z.number(),
  })
  .loose();

export const cartSchema = z
  .object({
    id: z.string(),
    status: z.string().optional(),
    userId: z.string().nullish(),
    sessionId: z.string().nullish(),
    lastActivityAt: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .loose();

export const cartItemSchema = z
  .object({
    id: z.string(),
    productId: z.string(),
    variantId: z.string().nullish(),
    qty: z.number(),
    unitPrice: z.number(),
    productName: z.string(),
    productSlug: z.string().nullish(),
    imageUrl: z.string().nullish(),
    variantLabel: z.string().nullish(),
    addedAt: z.string().optional(),
  })
  .loose();

export const cartResponseSchema = z
  .object({
    cart: cartSchema,
    items: z.array(cartItemSchema),
    totals: cartTotalsSchema,
  })
  .loose();

export const cartMutationResponseSchema = z
  .object({
    item: cartItemSchema,
    cartTotals: cartTotalsSchema,
  })
  .loose();

export const cartMergeResponseSchema = z.object({ cart: cartSchema }).loose();

export type CartTotalsDto = z.infer<typeof cartTotalsSchema>;
export type CartDto = z.infer<typeof cartSchema>;
export type CartItemDto = z.infer<typeof cartItemSchema>;
export type CartSnapshot = z.infer<typeof cartResponseSchema>;
