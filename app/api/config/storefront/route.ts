/**
 * GET /api/config/storefront — sf-077 / contracts 2.2.0.
 *
 * One versioned read for the admin app: the resolved CSS-var map the shell
 * paints from, the sparse palette it came from, nav, footer, catalog badges
 * and preview metadata. Public (no admin guard) because the shopper shell
 * needs the same config; a preview token opts into inactive/draft CMS reads.
 * cms-svc ignores invalid tokens, so a stale token is simply ignored.
 *
 * `configVersion` is the contract shape version; `revision` is the CMS document
 * revision. The numeric `version` alias stays for one release so a 2.1.0 reader
 * can repin without a flag day. Rejected: emitting admin-authored CSS text —
 * only typed palette/groups reach the resolver and its var emitters.
 */
import type { NextRequest, NextResponse } from "next/server";
import { jsonNoStore } from "@/lib/bff/handler";
import { catalogClient } from "@/lib/catalog/client";
import { createCmsClient, cmsBaseUrl } from "@/lib/cms/client";
import { resolveThemeSettings } from "@/lib/cms/themeSettings";
import { themeToCssVars } from "@/lib/cms/themeVars";
import {
  STOREFRONT_CONFIG_VERSION,
  STOREFRONT_CONFIG_VERSION_STRING,
} from "@/lib/config/version";
import { previewTokenFrom } from "@/lib/admin/guard";
import { PREVIEW_METADATA } from "@/lib/config/preview";
import { resolveComponentGroups, resolvePalette } from "@/lib/theme/palette";
import { paletteToThemeVars } from "@/lib/theme/vars";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const cms = createCmsClient({
    baseUrl: cmsBaseUrl(),
    previewToken: previewTokenFrom(request) ?? undefined,
  });

  const [theme, navigation, footer, badges] = await Promise.all([
    cms.getGlobalSettings(),
    cms.getNavigation(),
    cms.getFooter(),
    catalogClient().listPublicBadges(),
  ]);

  const settings = theme.data?.theme;
  const paletteSource = settings?.palette;
  const palette = resolvePalette({ global: paletteSource });
  const groups = resolveComponentGroups({
    palette,
    global: {
      navbar: settings?.navbar,
      filterRail: settings?.filterRail,
      drawer: settings?.drawer,
      marquee: settings?.marquee,
      grid: settings?.grid,
      productCard: settings?.productCard,
    },
  });
  const resolvedTheme = {
    ...themeToCssVars(resolveThemeSettings({ settings })),
    ...paletteToThemeVars(palette, groups),
  };

  const resolvedBadges = badges.ok
    ? badges.data.map((badge) => ({
        id: badge.id ?? badge.key,
        key: badge.key,
        label: badge.label,
        bg: badge.bg,
        textColor: badge.textColor,
        borderColor: badge.borderColor ?? undefined,
        ...(badge.borderStyle ? { borderStyle: badge.borderStyle } : {}),
      }))
    : [];

  return jsonNoStore({
    configVersion: STOREFRONT_CONFIG_VERSION_STRING,
    revision: theme.data?.version ?? 0,
    theme: resolvedTheme,
    ...(paletteSource ? { palette: paletteSource } : {}),
    navigation: navigation.data?.navbar ?? {},
    footer: footer.data?.footer ?? {},
    badges: resolvedBadges,
    preview: PREVIEW_METADATA,
    /** @deprecated Use configVersion; removed in contracts 2.3.0. */
    version: STOREFRONT_CONFIG_VERSION,
  });
}
