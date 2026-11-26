/**
 * Review write seam — sf-059 (A3.10), tightened to catalog-svc 303628b.
 *
 * Server-only. The storefront holds no JWT; the BFF forwards the caller's
 * identity headers to catalog-svc, which owns moderation (`status: pending`).
 * The storefront never shows a submitted review as published — success means
 * "queued for moderation", nothing more.
 *
 * No client idempotency key is invented: catalog-svc's POST has none, and a
 * made-up key would suggest replay protection that does not exist.
 */

import type { IdentityHeaders } from "@/lib/cart/client";
import { createServiceClient } from "@/lib/http/client";
import type { ServiceResult } from "@/lib/http/result";
import { createdReviewSchema, type CreatedReview, type CreateReviewInput } from "./schemas";

export interface ReviewClient {
  create(
    identity: IdentityHeaders,
    input: CreateReviewInput,
  ): Promise<ServiceResult<CreatedReview>>;
}

export function reviewClient(): ReviewClient {
  return {
    create(identity, input) {
      return createServiceClient("catalog")({
        method: "POST",
        path: `/api/v1/catalog/products/${encodeURIComponent(input.productId)}/reviews`,
        headers: identity,
        body: {
          rating: input.rating,
          ...(input.title ? { title: input.title } : {}),
          body: input.body,
        },
        schema: createdReviewSchema,
        cache: "no-store",
      });
    },
  };
}
