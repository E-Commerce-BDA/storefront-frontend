import { z } from "zod";

/** Review submission — sf-059 (A3.10). Moderation is the backend's job; the storefront only validates shape. */
export const createReviewSchema = z
  .object({
    orderId: z.string().min(1),
    productId: z.string().min(1),
    rating: z.number().int().min(1).max(5),
    title: z.string().max(255).optional(),
    body: z.string().max(4000).optional(),
  })
  .strict();

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
