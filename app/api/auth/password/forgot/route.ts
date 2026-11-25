/**
 * POST /api/auth/password/forgot — au-007
 *
 * Validate → forward → respond. auth-svc answers the same generic message for
 * an existing, unknown or disabled account, so this handler must not add a
 * success/failure branch that would leak which one it was. No token is ever
 * returned: delivery is not wired yet and the raw token is not stored.
 */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { authServiceUrl, createAuthClient } from "@/lib/auth/client";
import { badRequest, readJson } from "@/lib/bff/handler";

const forgotSchema = z
  .object({ email: z.string().trim().toLowerCase().email().max(255) })
  .strict();

export async function POST(request: NextRequest): Promise<NextResponse> {
  const parsed = forgotSchema.safeParse(await readJson(request));
  if (!parsed.success) return badRequest();

  const result = await createAuthClient({ baseUrl: authServiceUrl() }).forgotPassword(
    parsed.data.email,
  );
  if (!result.ok) {
    return NextResponse.json(
      { error: { code: result.code } },
      { status: result.status === 0 ? 503 : result.status },
    );
  }
  return NextResponse.json(
    { message: result.data.message },
    { status: 202, headers: { "cache-control": "no-store" } },
  );
}
