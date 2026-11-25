/** PATCH /api/account/password — sf-059 (A6.6). Forwarded to auth-svc; a successful change revokes its refresh sessions upstream. */

import type { NextRequest, NextResponse } from "next/server";
import { authResponse } from "@/lib/account/respond";
import { changePasswordSchema } from "@/lib/account/schemas";
import { authServiceUrl, createAuthClient } from "@/lib/auth/client";
import { badRequest, readJson, unauthenticated } from "@/lib/bff/handler";
import { readIdentity } from "@/lib/session/identity";

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const identity = readIdentity(request.cookies);
  if (identity.accessToken === null) return unauthenticated();

  const parsed = changePasswordSchema.safeParse(await readJson(request));
  if (!parsed.success) return badRequest();

  return authResponse(
    await createAuthClient({ baseUrl: authServiceUrl() }).changePassword(
      identity.accessToken,
      parsed.data,
    ),
  );
}
