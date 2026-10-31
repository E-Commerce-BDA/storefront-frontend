/**
 * POST /api/auth/login — BFF handler
 *
 * One action: validate the body → call auth-svc → put the token pair in
 * HttpOnly cookies → reply `{ user }`. The tokens exist only in this function's
 * frame; they are never serialised into the response (G3 asserts that
 * mechanically: `Object.keys(body)` is exactly `['user']`).
 */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { authServiceUrl, createAuthClient } from "@/lib/auth/client";
import { isSecureCookie, sessionCookies } from "@/lib/auth/session";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const loginSchema = z.object({
  email: z.string().trim().regex(EMAIL_RE),
  password: z.string().min(1),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const parsed = loginSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_FAILED" } },
      { status: 400 },
    );
  }

  const result = await createAuthClient({ baseUrl: authServiceUrl() }).login({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: { code: result.code } },
      { status: result.status === 0 ? 503 : result.status },
    );
  }

  const response = NextResponse.json({ user: result.data.user });
  for (const cookie of sessionCookies(result.data, {
    secure: isSecureCookie(),
  })) {
    response.cookies.set(cookie);
  }
  return response;
}

async function readJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
