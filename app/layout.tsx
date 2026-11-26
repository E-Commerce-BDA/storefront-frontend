import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import "./globals.css";
import { resolveNavSettings } from "@/lib/shell/resolveNav";
import { fetchNavSettings } from "@/lib/cms/navigation";
import { fetchFooter } from "@/lib/cms/footer";
import { SITE_DESCRIPTION, SITE_NAME, siteUrl } from "@/lib/site";
import { fetchThemeSettings } from "@/lib/cms/theme";
import { resolveThemeSettings } from "@/lib/cms/themeSettings";
import { themeToCssVars } from "@/lib/cms/themeVars";
import NavbarMount from "./_components/NavbarMount";
import FooterMount from "./_components/FooterMount";
import CartProvider from "./_components/CartProvider";
import { WishlistProvider } from "./_components/WishlistProvider";
import { CompareProvider } from "./_components/CompareProvider";
import PageViewTracker from "./_components/PageViewTracker";

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
 * Root layout — server resolves nav once per request (admin values flow
 * as concrete props; client never sees knob names), NavbarMount owns
 * interaction state below.
 *
 * `fetchNavSettings` never rejects: cms-svc down → stale cache → demo nav.
 * That ordering matters here more than anywhere else, because a throw in the
 * root layout blanks every route in the app.
 *
 * `fetchFooter` follows the same rule with a different fallback: the footer has
 * no builtin document to invent, so an outage yields `null` and the shell draws
 * its minimal face (four real routes). The two reads are issued together and
 * awaited together — they are one service and one budget, and serialising them
 * would double the worst-case added latency of a slow CMS.
 *
 * Mount order is navbar → page → footer. Plan §7 wrote "directly after
 * `NavbarMount`", which is right about *the layout owning the shell* and wrong
 * about *position*: a footer has to follow `{children}` to be at the bottom of
 * the document. Same owner, same props, DOM order corrected.
 *
 * `CartProvider` wraps the chrome *and* the page: the navbar badge, the drawer
 * and whatever route is rendering must all read one cart. It fetches once on
 * mount and holds no server data of its own, so the layout stays static.
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [navResult, footerResult, themeResult] = await Promise.all([
    fetchNavSettings(),
    fetchFooter(),
    fetchThemeSettings(),
  ]);
  const nav = resolveNavSettings({ settings: navResult.settings, global: null });
  const theme = resolveThemeSettings({ settings: themeResult.theme });
  return (
    <html lang="en" className={`${fraunces.variable} ${outfit.variable}`}>
      <body style={themeToCssVars(theme)}>
        <CartProvider drawerActions={nav.cart.drawerActions}>
          <WishlistProvider>
            <CompareProvider>
              <NavbarMount nav={nav} />
              {children}
              <FooterMount footer={footerResult.footer} />
              <PageViewTracker />
            </CompareProvider>
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
