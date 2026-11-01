/**
 * POST / DELETE /api/cart/items — BFF handler (sf-051)
 *
 * Add one line, or remove a batch. The writes that need the guest minting
 * fallback (`identityForWrite`): if `sf_cid` never reached the request, the item
 * still lands in a cart the browser will keep sending, and the minted cookie
 * rides the response.
 *
 * Both verbs are cookie-authenticated, so both check `sameOrigin` first.
 */

import type { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  badRequest,
  forbidden,
  idempotencyKey,
  noContent,
  readJson,
  sameOrigin,
  toResponse,
} from "@/lib/bff/handler";
import { cartClient } from "@/lib/cart/client";
import { identityForWrite, identityHeaders } from "@/lib/session/identity";

const addSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1).optional(),
  qty: z.number().int().min(1),
});

const removeSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!sameOrigin(request)) return forbidden();

  const parsed = addSchema.safeParse(await readJson(request));
  if (!parsed.success) return badRequest();

  const { identity, minted } = identityForWrite(request.cookies);
  const result = await cartClient().addItem(identityHeaders(identity), parsed.data, {
    idempotencyKey: idempotencyKey(request),
  });

  const response = toResponse(result, { status: 201 });
  if (minted !== null) response.cookies.set(minted);
  return response;
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  if (!sameOrigin(request)) return forbidden();

  const parsed = removeSchema.safeParse(await readJson(request));
  if (!parsed.success) return badRequest();

  const { identity, minted } = identityForWrite(request.cookies);
  const result = await cartClient().removeItems(identityHeaders(identity), parsed.data.ids, {
    idempotencyKey: idempotencyKey(request),
  });

  const response = result.ok ? noContent() : toResponse(result);
  if (minted !== null) response.cookies.set(minted);
  return response;
}
