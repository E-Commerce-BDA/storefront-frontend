import type { NextRequest, NextResponse } from "next/server";
import {
  apiError,
  forbidden,
  readJson,
  sameOrigin,
  toResponse,
} from "@/lib/bff/handler";
import { orderClient } from "@/lib/order/client";
import { validateDiscountCodeSchema } from "@/lib/order/schemas";

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!sameOrigin(request)) return forbidden();

  const parsed = validateDiscountCodeSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return apiError(400, "VALIDATION_FAILED", first ? `body.${first.path.join(".")}` : undefined);
  }

  const result = await orderClient().validateDiscountCode(parsed.data);
  // A9: valid:false is a *successful* validation answer ("that code is not
  // valid"), never a transport failure. Pass the body through verbatim so the
  // checkout form can show its honest invalid-coupon face.
  return toResponse(result, { status: 200 });
}
