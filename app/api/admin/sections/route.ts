/** GET/POST /api/admin/sections â€” sf-077. GET supports pageKey + preview. */
import type { NextRequest, NextResponse } from "next/server";
import { requireAdmin, previewTokenFrom } from "@/lib/admin/guard";
import { forwardAdmin } from "@/lib/admin/proxy";
import { forbidden, readJson, sameOrigin, toResponse } from "@/lib/bff/handler";

const PATH = "/api/v1/cms/sections";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { identity, error } = await requireAdmin(request);
  if (error !== null) return error;
  const pageKey = request.nextUrl.searchParams.get("pageKey");
  const qs = pageKey ? "?pageKey=" + encodeURIComponent(pageKey) : "";
  return toResponse(await forwardAdmin(request, {
    service: "cms", path: PATH + qs, identity, previewToken: previewTokenFrom(request),
  }));
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!sameOrigin(request)) return forbidden();
  const { identity, error } = await requireAdmin(request);
  if (error !== null) return error;
  return toResponse(await forwardAdmin(request, {
    service: "cms", path: PATH, method: "POST", body: await readJson(request), identity,
  }), { status: 201 });
}