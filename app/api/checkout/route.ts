/**
 * POST /api/checkout — BFF handler (sf-051)
 *
 * The one write where the idempotency key is **required**, and where its
 * absence is a 400 rather than something we paper over: order-svc keys its
 * replay cache on `x-idempotency-key`, and the guarantee the shopper is relying
 * on ("I clicked pay twice, I was charged once") only exists if the key
 * survives the retry loop in the browser. Minting one here would silently
 * disable it.
 *
 * The body is validated against the same `checkoutSchema` the client uses, so a
 * malformed attempt fails at the edge with `VALIDATION_FAILED` and never
 * reaches order-svc's stock reservation.
 *
 * Errors are forwarded verbatim — status and code. The checkout island has copy
 * for each family (409 stock, 409 attempt closed, 502 payment, 503 so-nothing-
 * was-charged) and needs the real code to pick one; see plan §8.
 */

import type { NextRequest, NextResponse } from "next/server";
import {
  apiError,
  badRequest,
  forbidden,
  readJson,
  requireIdempotencyKey,
  sameOrigin,
  toResponse,
  unauthenticated,
} from "@/lib/bff/handler";
import { orderClient } from "@/lib/order/client";
import { checkoutSchema } from "@/lib/order/schemas";
import { identityHeaders, readIdentity } from "@/lib/session/identity";

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!sameOrigin(request)) return forbidden();

  // Checkout needs a real session: an order belongs to an account. The proxy
  // already redirects a signed-out shopper off /checkout, so this is the
  // belt-and-braces copy for a direct POST.
  const identity = readIdentity(request.cookies);
  if (identity.accessToken === null) return unauthenticated();

  const idempotencyKey = requireIdempotencyKey(request);
  if (idempotencyKey === null) return badRequest("IDEMPOTENCY_KEY_REQUIRED");

  const parsed = checkoutSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return apiError(400, "VALIDATION_FAILED", first ? `body.${first.path.join(".")}` : undefined);
  }

  const result = await orderClient().checkout(identityHeaders(identity), parsed.data, {
    idempotencyKey,
  });
  // 201: the attempt created an order. A replay returns the same one, which is
  // exactly what "created" should mean under an idempotency key.
  return toResponse(result, { status: 201 });
}
