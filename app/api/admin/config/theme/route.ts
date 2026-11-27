/** GET/PUT /api/admin/config/theme — sf-077. Validate → guard → forward → respond. */
import type { NextRequest, NextResponse } from "next/server";
import { requireAdmin, previewTokenFrom } from "@/lib/admin/guard";
import { forwardAdmin } from "@/lib/admin/proxy";
import { toResponse } from "@/lib/bff/handler";
import { readJson, sameOrigin } from "@/lib/bff/handler";
import { forbidden } from "@/lib/bff/handler";

/** Reads stay on the public/versioned document; writes need the admin route. */
const READ_PATH = "/api/v1/cms/settings/global";
const WRITE_PATH = "/api/v1/cms/admin/settings/global";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { identity, error } = await requireAdmin(request);
  if (error !== null) return error;
  return toResponse(
    await forwardAdmin(request, {
      service: "cms",
      path: READ_PATH,
      identity,
      previewToken: previewTokenFrom(request),
    }),
  );
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  if (!sameOrigin(request)) return forbidden();
  const { identity, error } = await requireAdmin(request);
  if (error !== null) return error;
  return toResponse(
    await forwardAdmin(request, {
      service: "cms",
      path: WRITE_PATH,
      method: "PUT",
      body: await readJson(request),
      identity,
    }),
  );
}
