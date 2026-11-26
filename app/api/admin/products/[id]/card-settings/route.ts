/** GET/PATCH /api/admin/products/:id/card-settings â€” sf-077. */
import type { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import { forwardAdmin } from "@/lib/admin/proxy";
import { forbidden, readJson, sameOrigin, toResponse } from "@/lib/bff/handler";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Ctx): Promise<NextResponse> {
  const { identity, error } = await requireAdmin(request);
  if (error !== null) return error;
  const { id } = await params;
  return toResponse(await forwardAdmin(request, {
    service: "catalog", path: "/api/v1/catalog/products/" + encodeURIComponent(id) + "/card-settings", identity,
  }));
}

export async function PATCH(request: NextRequest, { params }: Ctx): Promise<NextResponse> {
  if (!sameOrigin(request)) return forbidden();
  const { identity, error } = await requireAdmin(request);
  if (error !== null) return error;
  const { id } = await params;
  return toResponse(await forwardAdmin(request, {
    service: "catalog", path: "/api/v1/catalog/products/" + encodeURIComponent(id) + "/card-settings",
    method: "PATCH", body: await readJson(request), identity,
  }));
}