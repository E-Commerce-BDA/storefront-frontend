import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import "./globals.css";
import { SITE_DESCRIPTION, SITE_NAME, siteUrl } from "@/lib/site";
import { fetchThemeSettings } from "@/lib/cms/theme";
import { resolveThemeSettings } from "@/lib/cms/themeSettings";
import { themeToCssVars } from "@/lib/cms/themeVars";
import { resolvePalette } from "@/lib/theme/palette";
import { paletteToThemeVars } from "@/lib/theme/vars";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  // One base for every absolute URL below this segment (canonical, OG, sitemap).
  // Without it a relative canonical in a child route fails the build.
  metadataBase: new URL(siteUrl()),
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
};

/**
 * Root layout — providers + theme only.
 *
 * A15: navbar and footer moved to the `(shop)` group so sign-in/sign-up get a
 * conversion surface without storefront chrome. The providers stay at the root
 * because a route may need the cart before it renders its own chrome.
 *
 * `fetchThemeSettings` never rejects: cms-svc down → stale cache → demo theme.
 * A throw in the root layout would blank every route, so this one read is the
 * only CMS dependency here.
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // A15: shop chrome belongs to the (shop) group, not the root — auth routes
  // get a conversion surface, not a storefront header and footer.
  const themeResult = await fetchThemeSettings();
  const theme = resolveThemeSettings({ settings: themeResult.theme });
  // The palette is a separate, versioned layer: cms-svc validation keeps raw
  // admin CSS out, the resolver clamps it, and the emitter paints via vars.
  const palette = resolvePalette({ global: themeResult.theme?.palette });
  return (
    <html lang="en" className={`${fraunces.variable} ${outfit.variable}`}>
      <body style={{ ...themeToCssVars(theme), ...paletteToThemeVars(palette) }}>{children}</body>
    </html>
  );
}
