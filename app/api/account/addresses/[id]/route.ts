/** PATCH/DELETE /api/account/addresses/[id] — sf-059 (A6.2). */

import type { NextRequest, NextResponse } from "next/server";
import { authResponse } from "@/lib/account/respond";
import { updateAddressSchema } from "@/lib/account/schemas";
import { authServiceUrl, createAuthClient } from "@/lib/auth/client";
import { badRequest, readJson, unauthenticated } from "@/lib/bff/handler";
import { readIdentity } from "@/lib/session/identity";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const identity = readIdentity(request.cookies);
  if (identity.accessToken === null) return unauthenticated();

  const parsed = updateAddressSchema.safeParse(await readJson(request));
  if (!parsed.success) return badRequest();

  const { id } = await context.params;
  return authResponse(
    await createAuthClient({ baseUrl: authServiceUrl() }).updateAddress(
      identity.accessToken,
      id,
      parsed.data,
    ),
  );
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const identity = readIdentity(request.cookies);
  if (identity.accessToken === null) return unauthenticated();

  const { id } = await context.params;
  return authResponse(
    await createAuthClient({ baseUrl: authServiceUrl() }).deleteAddress(identity.accessToken, id),
  );
}
