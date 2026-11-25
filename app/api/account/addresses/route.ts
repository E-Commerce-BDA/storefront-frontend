/** GET/POST /api/account/addresses — sf-059 (A6.2). One read, one write, one seam. */

import type { NextRequest, NextResponse } from "next/server";
import { authResponse } from "@/lib/account/respond";
import { accountAddressSchema } from "@/lib/account/schemas";
import { authServiceUrl, createAuthClient } from "@/lib/auth/client";
import { badRequest, readJson, unauthenticated } from "@/lib/bff/handler";
import { readIdentity } from "@/lib/session/identity";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const identity = readIdentity(request.cookies);
  if (identity.accessToken === null) return unauthenticated();
  return authResponse(
    await createAuthClient({ baseUrl: authServiceUrl() }).listAddresses(identity.accessToken),
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const identity = readIdentity(request.cookies);
  if (identity.accessToken === null) return unauthenticated();

  const parsed = accountAddressSchema.safeParse(await readJson(request));
  if (!parsed.success) return badRequest();

  return authResponse(
    await createAuthClient({ baseUrl: authServiceUrl() }).createAddress(
      identity.accessToken,
      parsed.data,
    ),
    201,
  );
}
