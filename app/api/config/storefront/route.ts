/**
 * GET /api/config/storefront — sf-077.
 *
 * One versioned read for the admin app: theme, navigation, footer and badges.
 * Public (no admin guard) because the storefront shell itself needs the same
 * config; a preview token opts into inactive/draft CMS reads. cms-svc ignores
 * invalid tokens, so a stale token is simply ignored — never an error.
 */
import type { NextRequest, NextResponse } from "next/server";
import { jsonNoStore } from "@/lib/bff/handler";
import { createCmsClient, cmsBaseUrl } from "@/lib/cms/client";
import { previewTokenFrom } from "@/lib/admin/guard";
import { STOREFRONT_CONFIG_VERSION } from "@/lib/config/version";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const cms = createCmsClient({
    baseUrl: cmsBaseUrl(),
    previewToken: previewTokenFrom(request) ?? undefined,
  });

  const [theme, navigation, footer] = await Promise.all([
    cms.getGlobalSettings(),
    cms.getNavigation(),
    cms.getFooter(),
  ]);

  return jsonNoStore({
    version: STOREFRONT_CONFIG_VERSION,
    theme: theme.data,
    navigation: navigation.data,
    footer: footer.data,
    badges: [],
  });
}
