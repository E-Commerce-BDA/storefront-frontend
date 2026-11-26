import { z } from "zod";

/**
 * Review submission — sf-059 (A3.10), tightened to catalog-svc 303628b.
 *
 * catalog-svc's global whitelist strips undeclared keys, so we must not send
 * `orderId` (it would be discarded silently). Title caps at 120 and body at
 * 2000 — the service rejects 255/4000 with a 400 that used to look like a
 * storefront bug. `body` is required by the service; the UI always sends it.
 */
export const createReviewSchema = z
  .object({
    productId: z.string().min(1),
    rating: z.number().int().min(1).max(5),
    title: z.string().min(1).max(120).optional(),
    body: z.string().min(1).max(2000),
  })
  .strict();

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

/** The 201 body: a queued review is pending, never published. */
export const createdReviewSchema = z.object({
  id: z.string(),
  productId: z.string(),
  status: z.literal("pending"),
  createdAt: z.string(),
});
export type CreatedReview = z.infer<typeof createdReviewSchema>;
