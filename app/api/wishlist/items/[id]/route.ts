import type { NextRequest, NextResponse } from "next/server";
import { noContent, toResponse, unauthenticated } from "@/lib/bff/handler";
import { identityHeaders, readIdentity } from "@/lib/session/identity";
import { wishlistClient } from "@/lib/wishlist/client";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const identity = readIdentity(request.cookies);
  if (identity.accessToken === null) {
    return unauthenticated();
  }

  const { id } = await params;
  const result = await wishlistClient().removeItem(identityHeaders(identity), id);
  if (result.ok) {
    return noContent();
  }
  return toResponse(result);
}

