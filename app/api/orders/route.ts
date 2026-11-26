import type { NextRequest, NextResponse } from "next/server";
import { toResponse, unauthenticated } from "@/lib/bff/handler";
import { orderClient } from "@/lib/order/client";
import { identityHeaders, readIdentity } from "@/lib/session/identity";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const identity = readIdentity(request.cookies);
  if (identity.accessToken === null) return unauthenticated();

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor") ?? undefined;
  const limitParam = searchParams.get("limit");
  // I-23: a caller-supplied limit must not bypass order-svc's page ceiling.
  // A missing or malformed value falls back to the default; the rest clamps.
  const parsed = limitParam !== null ? Number(limitParam) : Number.NaN;
  const limit = Number.isFinite(parsed)
    ? Math.min(100, Math.max(1, Math.trunc(parsed)))
    : 20;

  const result = await orderClient().listOrders(identityHeaders(identity), {
    cursor,
    limit,
  });

  return toResponse(result);
}
