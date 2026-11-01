/**
 * POST /api/auth/register — BFF handler
 *
 * Sign-up is sign-in: the auth client calls auth-svc register (creates the
 * account, 201) then auth-svc login (issues the token pair). The handler
 * receives a full `AuthSession` and proceeds identically to login: validate →
 * auth-svc → HttpOnly cookies → merge the guest cart → `{ user }`. A duplicate
 * email arrives as `409` and is reported as `EMAIL_TAKEN`, which is the one
 * auth error that is safe to name (the shopper already knows they have an
 * account, and "sign in instead?" is the useful next step).
 */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { authServiceUrl, createAuthClient } from "@/lib/auth/client";
import { isSecureCookie, sessionCookies } from "@/lib/auth/session";
import { absorbGuestCart } from "@/lib/cart/absorb";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const registerSchema = z.object({
  email: z.string().trim().regex(EMAIL_RE),
  password: z.string().min(8),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const parsed = registerSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_FAILED" } },
      { status: 400 },
    );
  }

  const result = await createAuthClient({
    baseUrl: authServiceUrl(),
  }).register(parsed.data);

  if (!result.ok) {
    return NextResponse.json(
      { error: { code: result.code } },
      { status: result.status === 0 ? 503 : result.status },
    );
  }

  const response = NextResponse.json(
    { user: result.data.user },
    { status: 201 },
  );
  for (const cookie of sessionCookies(result.data, {
    secure: isSecureCookie(),
  })) {
    response.cookies.set(cookie);
  }
  // A4.6: same as login — a shopper who filled a basket before registering
  // keeps it. Never blocks the 201.
  await absorbGuestCart(request, response, result.data);
  return response;
}

async function readJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
