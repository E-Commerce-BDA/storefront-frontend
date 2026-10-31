import type { NavSettings } from "./navSettings";

/**
 * Demo nav input — the documented fallback, and nothing else.
 *
 * Since sf-050 the live path is `lib/cms/navigation.ts` (`fetchNavSettings`:
 * cms-svc → stale cache → this object). It is still imported by the resolver
 * tests and by `app/components/page.tsx` (showcase, deleted at launch), which
 * is why it survives — a CMS outage has to render *something*, and a blank
 * navbar is worse than demo chrome.
 *
 * No TODO left on the app routes — they are wired. The remaining consumer is
 * the showcase page (`app/components`), which is deleted at launch.
 */
export const DEMO_NAV_INPUT: NavSettings = {
  shared: {
    announcement: {
      items: [
        { text: "Free shipping over $75", cta: { label: "Details", href: "/shipping" } },
        { text: "Diwali sale is live", cta: { label: "Shop the drop", href: "/sale" } },
      ],
      showArrows: true,
      dismissible: true,
    },
    links: {
      maxItems: 5,
      items: [
        { kind: "custom", label: "New in", href: "/new" },
        { kind: "custom", label: "Clothing", href: "/clothing" },
        { kind: "custom", label: "Shoes", href: "/shoes" },
        { kind: "custom", label: "Brands", href: "/brands" },
        { kind: "custom", label: "Sale", href: "/sale", highlight: "sale" },
      ],
    },
  },
};
