
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
    /** sf-058: attached by our BFF from catalog; cart-svc never holds stock. */
    stock: z.number().nullish(),
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

/**
 * What **our own BFF** answers, which differs from cart-svc in two ways: the
 * envelope is `{cart, items, totals}` with `cart` still possible (null before
 * the first item), and a mutation returns `{item, totals}` — the service's
 * `cartTotals` renamed on the way out (`app/api/cart/items/route.ts`).
 *
 * Kept separate from `cartResponseSchema` on purpose: the service contract is
 * strict about `cart`, and loosening it there would hide a broken upstream.
 */
export const cartSnapshotSchema = z
  .object({
    cart: cartSchema.nullish(),
    items: z.array(cartItemSchema),
    totals: cartTotalsSchema,
  })
  .loose();

export const cartMutationSchema = z
  .object({
    item: cartItemSchema,
    totals: cartTotalsSchema,
  })
  .loose();

export type CartTotalsDto = z.infer<typeof cartTotalsSchema>;
export type CartDto = z.infer<typeof cartSchema>;
export type CartItemDto = z.infer<typeof cartItemSchema>;
export type CartSnapshot = z.infer<typeof cartResponseSchema>;
export type CartSnapshotDto = z.infer<typeof cartSnapshotSchema>;
export type CartMutationDto = z.infer<typeof cartMutationSchema>;
