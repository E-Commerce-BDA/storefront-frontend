/**
 * PATCH / DELETE /api/cart/items/[id] — BFF handler (sf-051)
 *
 * One line's quantity, or one line gone. `qty` is validated here rather than
 * passed through because cart-svc's 400 carries no field path, and "quantity
 * must be a whole number ≥ 1" is copy the UI can act on.
 *
 * `params` is a Promise in Next 16 — awaiting it is not optional.
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

const qtySchema = z.object({ qty: z.number().int().min(1) });

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  if (!sameOrigin(request)) return forbidden();

  const parsed = qtySchema.safeParse(await readJson(request));
  if (!parsed.success) return badRequest();

  const { id } = await context.params;
  const { identity, minted } = identityForWrite(request.cookies);
  const result = await cartClient().updateItem(
    identityHeaders(identity),
    id,
    parsed.data.qty,
    { idempotencyKey: idempotencyKey(request) },
  );

  const response = toResponse(result);
  if (minted !== null) response.cookies.set(minted);
  return response;
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  if (!sameOrigin(request)) return forbidden();

  const { id } = await context.params;
  const { identity, minted } = identityForWrite(request.cookies);
  const result = await cartClient().removeItem(identityHeaders(identity), id, {
    idempotencyKey: idempotencyKey(request),
  });

  const response = result.ok ? noContent() : toResponse(result);
  if (minted !== null) response.cookies.set(minted);
  return response;
}
