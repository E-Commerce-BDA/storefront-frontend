/**
 * `(shop)` group layout — sf-051, full-bleed shell at sf-060, sf-074 (A15).
 *
 * One shell, no max-width: `.sf-shop` owns the page gutter through
 * `--sf-page-pad` (≤50px combined edge gap, design-system §4/§8), so `/products`,
 * the PDP, `/cart`, the CMS home and every section below align on the same edge
 * and none of them repeats a container. Adding a route is one page file with no
 * layout boilerplate — the seam's whole promise (§1).
 *
 * A15: the storefront navbar and footer live here, not in the root layout, so
 * `(auth)` routes keep a clean conversion surface. Both CMS reads never reject
 * (stale cache → demo nav / minimal footer), and they are awaited together as
 * one service budget.
 *
 * sf-079: the chrome sits OUTSIDE `.sf-shop`. The page container owns the
 * horizontal gutter; the navbar and footer each own theirs, so nesting them
 * inset the bars twice (~100px vs the page's ~50px). Rejected alternative:
 * strip the chrome's padding — that would leave the bars' own backgrounds
 * flush to the viewport edge and break their documented gutter contract.
 *
 * `connection()` keeps the shell config request-fresh. Prerendering this layout
 * froze nav/announcement/footer into each route's HTML at build time, so
 * /about kept the old wordmark while /shop showed the resolved config. The
 * rejected alternative was a global revalidate change: too broad, and it
 * would still let two routes read two different build-time snapshots.
 */

import { connection } from "next/server";
import CartProvider from "../_components/CartProvider";
import { WishlistProvider } from "../_components/WishlistProvider";
import { CompareProvider } from "../_components/CompareProvider";
import PageViewTracker from "../_components/PageViewTracker";
import NavbarMount from "../_components/NavbarMount";
import FooterMount from "../_components/FooterMount";
import { fetchFooter } from "@/lib/cms/footer";
import { fetchNavSettings } from "@/lib/cms/navigation";
import { resolveNavSettings } from "@/lib/shell/resolveNav";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  await connection();
  const [navResult, footerResult] = await Promise.all([fetchNavSettings(), fetchFooter()]);
  const nav = resolveNavSettings({ settings: navResult.settings, global: null });

  return (
    <CartProvider drawerActions={nav.cart.drawerActions}>
      <WishlistProvider>
        <CompareProvider>
          <NavbarMount nav={nav} />
          <div className="sf-shop">{children}</div>
          <FooterMount footer={footerResult.footer} />
          <PageViewTracker />
        </CompareProvider>
      </WishlistProvider>
    </CartProvider>
  );
}
