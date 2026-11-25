/**
 * Review write seam — sf-059 (A3.10)
 *
 * Server-only. The storefront holds no JWT; the BFF forwards the caller's
 * identity headers to catalog-svc, which owns moderation (`is_approved`).
 * The storefront never shows a submitted review as published — success means
 * "queued for moderation", nothing more.
 */

import { z } from "zod";
import type { IdentityHeaders } from "@/lib/cart/client";
import { createServiceClient } from "@/lib/http/client";
import type { ServiceResult } from "@/lib/http/result";
import type { CreateReviewInput } from "./schemas";

export interface ReviewClient {
  create(
    identity: IdentityHeaders,
    input: CreateReviewInput,
  ): Promise<ServiceResult<{ id: string }>>;
}

const createdSchema = z.object({ id: z.string() }).loose();

export function reviewClient(): ReviewClient {
  return {
    create(identity, input) {
      return createServiceClient("catalog")({
        method: "POST",
        path: `/api/v1/catalog/products/${encodeURIComponent(input.productId)}/reviews`,
        headers: identity,
        body: {
          orderId: input.orderId,
          rating: input.rating,
          ...(input.title ? { title: input.title } : {}),
          ...(input.body ? { body: input.body } : {}),
        },
        schema: createdSchema,
        cache: "no-store",
      });
    },
  };
}
