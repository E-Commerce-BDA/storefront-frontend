import { NextResponse } from "next/server";
import type { AuthResult } from "@/lib/auth/client";

/**
 * AuthResult → NextResponse, one mapping for every account-write handler.
 * A `null` payload is a 204 (password change, address delete); everything else
 * is a `no-store` JSON body. The upstream code is forwarded, never a message
 * parsed from prose.
 */
export function authResponse<T>(result: AuthResult<T>, status = 200): NextResponse {
  if (!result.ok) {
    return NextResponse.json(
      { error: { code: result.code } },
      { status: result.status === 0 ? 503 : result.status },
    );
  }
  if (result.data === null) {
    return new NextResponse(null, { status: 204, headers: { "cache-control": "no-store" } });
  }
  return NextResponse.json(result.data, {
    status,
    headers: { "cache-control": "no-store" },
  });
}
