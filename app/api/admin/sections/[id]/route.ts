/** PATCH/DELETE /api/admin/sections/[id] â€” sf-077. */
import type { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import { forwardAdmin } from "@/lib/admin/proxy";
import { forbidden, readJson, sameOrigin, toResponse } from "@/lib/bff/handler";

type Ctx = { params: Promise<{ id: string }> };
const PATH = "/api/v1/cms/sections/";

export async function PATCH(request: NextRequest, { params }: Ctx): Promise<NextResponse> {
  if (!sameOrigin(request)) return forbidden();
  const { identity, error } = await requireAdmin(request);
  if (error !== null) return error;
  const { id } = await params;
  return toResponse(await forwardAdmin(request, {
    service: "cms", path: PATH + encodeURIComponent(id), method: "PATCH",
    body: await readJson(request), identity,
  }));
}

export async function DELETE(request: NextRequest, { params }: Ctx): Promise<NextResponse> {
  if (!sameOrigin(request)) return forbidden();
  const { identity, error } = await requireAdmin(request);
  if (error !== null) return error;
  const { id } = await params;
  return toResponse(await forwardAdmin(request, {
    service: "cms", path: PATH + encodeURIComponent(id), method: "DELETE", identity,
  }));
}