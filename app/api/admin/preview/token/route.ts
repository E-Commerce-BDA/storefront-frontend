/**
 * GET /api/admin/preview/token — mint a scoped, expiring CMS preview token.
 *
 * The admin app obtains the token through this origin; it never calls cms-svc
 * directly and never sees a service bearer. The token itself is passed back on
 * public reads as `x-preview-token` / `?preview=` (lib/admin/guard.ts).
 */
import type { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import { adminQuery, forwardAdmin } from "@/lib/admin/proxy";
import { toResponse } from "@/lib/bff/handler";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { identity, error } = await requireAdmin(request);
  if (error !== null) return error;
  return toResponse(
    await forwardAdmin(request, {
      service: "cms",
      path: `/api/v1/cms/admin/preview-token${adminQuery(request, ["expiresIn"])}`,
      identity,
    }),
  );
}
