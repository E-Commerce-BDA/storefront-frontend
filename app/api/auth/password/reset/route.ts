/** POST /api/auth/password/reset — au-007. Validate → forward → 204. Errors are the auth-svc codes, never parsed prose. */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { authServiceUrl, createAuthClient } from "@/lib/auth/client";
import { badRequest, readJson } from "@/lib/bff/handler";

const resetSchema = z
  .object({
    token: z.string().min(1),
    newPassword: z.string().min(8).max(128).regex(/^(?=.*[a-zA-Z])(?=.*\d)/),
  })
  .strict();

export async function POST(request: NextRequest): Promise<NextResponse> {
  const parsed = resetSchema.safeParse(await readJson(request));
  if (!parsed.success) return badRequest();

  const result = await createAuthClient({ baseUrl: authServiceUrl() }).resetPassword(
    parsed.data.token,
    parsed.data.newPassword,
  );
  if (!result.ok) {
    return NextResponse.json(
      { error: { code: result.code } },
      { status: result.status === 0 ? 503 : result.status },
    );
  }
  return new NextResponse(null, { status: 204, headers: { "cache-control": "no-store" } });
}
