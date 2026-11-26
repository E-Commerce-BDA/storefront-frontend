/** GET/PUT /api/admin/pages/:pageKey â€” sf-077. */
import type { NextRequest, NextResponse } from "next/server";
import { requireAdmin, previewTokenFrom } from "@/lib/admin/guard";
import { forwardAdmin } from "@/lib/admin/proxy";
import { forbidden, readJson, sameOrigin, toResponse } from "@/lib/bff/handler";

type Ctx = { params: Promise<{ pageKey: string }> };

export async function GET(request: NextRequest, { params }: Ctx): Promise<NextResponse> {
  const { identity, error } = await requireAdmin(request);
  if (error !== null) return error;
  const { pageKey } = await params;
  return toResponse(await forwardAdmin(request, {
    service: "cms", path: "/api/v1/cms/pages/" + encodeURIComponent(pageKey),
    identity, previewToken: previewTokenFrom(request),
  }));
}

export async function PUT(request: NextRequest, { params }: Ctx): Promise<NextResponse> {
  if (!sameOrigin(request)) return forbidden();
  const { identity, error } = await requireAdmin(request);
  if (error !== null) return error;
  const { pageKey } = await params;
  return toResponse(await forwardAdmin(request, {
    service: "cms", path: "/api/v1/cms/pages/" + encodeURIComponent(pageKey),
    method: "PUT", body: await readJson(request), identity,
  }));
}