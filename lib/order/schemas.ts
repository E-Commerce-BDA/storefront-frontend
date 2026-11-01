/**
 * Order schemas — sf-051
 * (order-svc `src/db/rows.ts`, `checkout.service.ts`, `orders.repository.ts`)
 *
 * order-svc answers **snake_case** rows for reads and **camelCase** objects for
 * the checkout confirmation, but money is one type in both: `DECIMAL(12,2)` is
 * parsed to a number at order-svc's persistence boundary (`src/db/pool.ts`), so
 * the service never sends `"129.90"` where the shopper expects `129.9`. Nothing
 * here coerces — a schema that accepts two types is a schema that hides a bug.
 *
 * Loose objects again — a new order column must not blank a confirmation page.
 * The fields the account and confirmation screens read are required.
 */

import { z } from "zod";

/* ── money ───────────────────────────────────────────────────────────────── */

/** Dollars, as a number. The service owns the type; the view only formats it. */
const money = z.number();

/* ── checkout (write + its confirmation) ─────────────────────────────────── */

export const addressSchema = z
  .object({
    line1: z.string(),
    line2: z.string().optional(),
    city: z.string(),
    state: z.string().optional(),
    postalCode: z.string(),
    /** ISO-3166 alpha-2 — order-svc validates exactly 2 characters. */
    country: z.string().length(2),
  })
  .loose();

export const checkoutItemInputSchema = z
  .object({
    productId: z.string(),
    variantId: z.string().optional(),
    qty: z.number().int().min(1),
  })
  .loose();

export const checkoutSchema = z
  .object({
    items: z.array(checkoutItemInputSchema).min(1),
    shippingAddress: addressSchema,
    billingAddress: addressSchema,
    discountCode: z.string().optional(),
    payment: z.object({ provider: z.enum(["mock", "stripe", "paypal"]) }).loose(),
    notes: z.string().optional(),
  })
  .loose();

export const checkoutTotalsSchema = z
  .object({
    subtotal: money,
    shipping: money,
    tax: money,
    discount: money,
    grandTotal: money,
  })
  .loose();

export const checkoutItemResponseSchema = z
  .object({
    productId: z.string(),
    variantId: z.string().optional(),
    productName: z.string(),
    sku: z.string(),
    unitPrice: money,
    qty: z.number(),
    lineTotal: money,
  })
  .loose();

export const checkoutConfirmationSchema = z
  .object({
    orderId: z.string(),
    orderNumber: z.string(),
    status: z.string(),
    totals: checkoutTotalsSchema,
    items: z.array(checkoutItemResponseSchema),
  })
  .loose();

/* ── order rows (read) ───────────────────────────────────────────────────── */

export const orderAddressSchema = z
  .object({
    line1: z.string(),
    line2: z.string().optional(),
    city: z.string(),
    state: z.string().optional(),
    postalCode: z.string(),
    country: z.string(),
  })
  .loose();

export const orderItemRowSchema = z
  .object({
    id: z.string(),
    order_id: z.string().optional(),
    product_id: z.string(),
    variant_id: z.string().nullish(),
    product_name: z.string(),
    sku: z.string(),
    unit_price: money,
    qty: z.number(),
    line_total: money,
    options: z.record(z.string(), z.string()).nullish(),
  })
  .loose();

export const orderStatusHistoryRowSchema = z
  .object({
    id: z.string().optional(),
    order_id: z.string().optional(),
    status: z.string(),
    note: z.string().nullish(),
    created_at: z.string().optional(),
  })
  .loose();

export const paymentRowSchema = z
  .object({
    id: z.string().optional(),
    provider: z.string().nullish(),
    status: z.string().nullish(),
    amount: money.nullish(),
    created_at: z.string().optional(),
  })
  .loose();

export const orderSchema = z
  .object({
    id: z.string(),
    order_number: z.string(),
    status: z.string(),
    subtotal: money,
    shipping_fee: money,
    tax: money,
    discount: money,
    grand_total: money,
    currency: z.string().optional(),
    payment_status: z.string().optional(),
    shipping_address: orderAddressSchema,
    billing_address: orderAddressSchema.optional(),
    notes: z.string().nullish(),
    created_at: z.string(),
    updated_at: z.string().optional(),
    items: z.array(orderItemRowSchema).default([]),
    status_history: z.array(orderStatusHistoryRowSchema).nullish(),
    payments: z.array(paymentRowSchema).nullish(),
  })
  .loose();

export const orderListResponseSchema = z
  .object({
    data: z.array(orderSchema),
    nextCursor: z.string().nullish(),
  })
  .loose();

export const orderResponseSchema = z.object({ order: orderSchema }).loose();

export type AddressInput = z.infer<typeof addressSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type CheckoutConfirmationDto = z.infer<typeof checkoutConfirmationSchema>;
export type CheckoutItemInput = z.infer<typeof checkoutItemInputSchema>;
export type OrderItemRowDto = z.infer<typeof orderItemRowSchema>;
export type OrderDto = z.infer<typeof orderSchema>;
