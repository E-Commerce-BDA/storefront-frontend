/** POST /api/reviews — sf-059 (A3.10). Validate → forward to catalog-svc → respond. */

import type { NextRequest, NextResponse } from "next/server";
import { badRequest, readJson, toResponse, unauthenticated } from "@/lib/bff/handler";
import { reviewClient } from "@/lib/reviews/client";
import { createReviewSchema } from "@/lib/reviews/schemas";
import { identityHeaders, readIdentity } from "@/lib/session/identity";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const identity = readIdentity(request.cookies);
  if (identity.accessToken === null) return unauthenticated();

  const parsed = createReviewSchema.safeParse(await readJson(request));
  if (!parsed.success) return badRequest();

  return toResponse(await reviewClient().create(identityHeaders(identity), parsed.data), {
    status: 201,
  });
}
