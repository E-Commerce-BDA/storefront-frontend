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
  const limit = limitParam ? parseInt(limitParam, 10) : 20;

  const result = await orderClient().listOrders(identityHeaders(identity), {
    cursor,
    limit,
  });

  return toResponse(result);
}
