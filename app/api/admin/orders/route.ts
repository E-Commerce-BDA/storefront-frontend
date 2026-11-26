/** GET /api/admin/orders â€” sf-077 (order-svc admin list). */
import type { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import { forwardAdmin } from "@/lib/admin/proxy";
import { adminQuery } from "@/lib/admin/proxy";
import { toResponse } from "@/lib/bff/handler";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { identity, error } = await requireAdmin(request);
  if (error !== null) return error;
  const qs = adminQuery(request, ["status", "cursor", "limit"]);
  return toResponse(await forwardAdmin(request, {
    service: "order", path: "/api/v1/orders" + qs, identity,
  }));
}