/** GET /api/admin/orders/:id â€” sf-077 (order-svc admin detail). */
import type { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import { forwardAdmin } from "@/lib/admin/proxy";
import { toResponse } from "@/lib/bff/handler";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Ctx): Promise<NextResponse> {
  const { identity, error } = await requireAdmin(request);
  if (error !== null) return error;
  const { id } = await params;
  return toResponse(await forwardAdmin(request, {
    service: "order", path: "/api/v1/orders/" + encodeURIComponent(id), identity,
  }));
}