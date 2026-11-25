/**
 * GET /api/search/trending — sf-066 (search-svc srch-006)
 *
 * The browser asks this origin; only this handler knows internal/trending
 * exists, and only the server client attaches `x-service-key`. Unknown query
 * params and an out-of-range limit are rejected here rather than forwarded,
 * matching search-svc's 400 contract.
 */

import type { NextRequest, NextResponse } from "next/server";
import { badRequest, toResponse } from "@/lib/bff/handler";
import { searchClient } from "@/lib/search/client";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  for (const key of searchParams.keys()) {
    if (key !== "limit") return badRequest();
  }

  let limit = 8;
  const raw = searchParams.get("limit");
  if (raw !== null) {
    if (!/^\d+$/.test(raw)) return badRequest();
    limit = Number(raw);
    if (!Number.isInteger(limit) || limit < 1 || limit > 20) return badRequest();
  }

  return toResponse(await searchClient().trending(limit));
}
