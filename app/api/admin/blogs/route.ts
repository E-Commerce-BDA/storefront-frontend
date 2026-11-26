/** GET/POST /api/admin/blogs â€” sf-077. */
import type { NextRequest, NextResponse } from "next/server";
import { requireAdmin, previewTokenFrom } from "@/lib/admin/guard";
import { forwardAdmin } from "@/lib/admin/proxy";
import { forbidden, readJson, sameOrigin, toResponse } from "@/lib/bff/handler";

const PATH = "/api/v1/cms/blogs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { identity, error } = await requireAdmin(request);
  if (error !== null) return error;
  return toResponse(await forwardAdmin(request, {
    service: "cms", path: PATH, identity, previewToken: previewTokenFrom(request),
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