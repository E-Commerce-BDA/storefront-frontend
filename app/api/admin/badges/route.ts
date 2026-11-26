/** GET /api/admin/badges â€” sf-077 (forwarded from cms-svc badge registry). */
import type { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import { forwardAdmin } from "@/lib/admin/proxy";
import { toResponse } from "@/lib/bff/handler";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { identity, error } = await requireAdmin(request);
  if (error !== null) return error;
  return toResponse(await forwardAdmin(request, {
    service: "cms", path: "/api/v1/cms/badges", identity,
  }));
}