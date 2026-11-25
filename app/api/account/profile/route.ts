/** PATCH /api/account/profile — sf-059 (A6.1). Validate → forward → respond. */

import type { NextRequest, NextResponse } from "next/server";
import { updateProfileSchema } from "@/lib/account/schemas";
import { authResponse } from "@/lib/account/respond";
import { authServiceUrl, createAuthClient } from "@/lib/auth/client";
import { badRequest, readJson, unauthenticated } from "@/lib/bff/handler";
import { readIdentity } from "@/lib/session/identity";

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const identity = readIdentity(request.cookies);
  if (identity.accessToken === null) return unauthenticated();

  const parsed = updateProfileSchema.safeParse(await readJson(request));
  if (!parsed.success) return badRequest();

  return authResponse(
    await createAuthClient({ baseUrl: authServiceUrl() }).updateProfile(
      identity.accessToken,
      parsed.data,
    ),
  );
}
