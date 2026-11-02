import { NextResponse, type NextRequest } from "next/server";
import { badRequest, readJson, toResponse } from "@/lib/bff/handler";
import { isSecureCookie } from "@/lib/auth/session";
import { identityHeaders, readIdentity } from "@/lib/session/identity";
import { wishlistClient } from "@/lib/wishlist/client";
import { buildPendingWishlistCookie } from "@/lib/wishlist/pending";
import { addWishlistItemPayloadSchema } from "@/lib/wishlist/schemas";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const parsed = addWishlistItemPayloadSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return badRequest();
  }

  const { productId } = parsed.data;
  const identity = readIdentity(request.cookies);

  // Guest flow: set sf_pw cookie and signal AUTH_REQUIRED
  if (identity.accessToken === null) {
    const res = NextResponse.json(
      {
        error: {
          code: "AUTH_REQUIRED",
          message: "Please sign in to save items to your wishlist",
        },
      },
      { status: 401, headers: { "cache-control": "no-store" } },
    );
    res.cookies.set(buildPendingWishlistCookie(productId, { secure: isSecureCookie() }));
    return res;
  }

  // Authenticated flow: forward to cart-svc
  const result = await wishlistClient().addItem(identityHeaders(identity), productId);
  return toResponse(result, { status: 201 });
}
