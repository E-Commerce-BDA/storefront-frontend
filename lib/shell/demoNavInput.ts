import type { NavSettings } from "./navSettings";

/**
 * Demo nav input — shared scaffolding seam (layout, homepage, showcase
 * all read this one object). Visibly-marked demo content, not copy —
 * never translate it, never A/B test against it.
 *
 * TODO(cms-svc): replace imports of this with the CMS read (same
 * NavSettings shape the service returns) so the real resolver runs on
 * live data. One-line swap per call site; callers never change.
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
