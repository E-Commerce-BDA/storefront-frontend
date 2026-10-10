import { resolveNavSettings } from "@/lib/shell/resolveNav";
import type { NavSettings } from "@/lib/shell/navSettings";
import HomeChrome from "./_components/HomeChrome";

/**
 * Home route (/) — mounts chrome explicitly (per-page mount: auth routes
 * stay chromeless). Interim: section index below chrome until hero lands.
 *
 * TODO(cms-svc): replace DEMO_NAV_INPUT with the CMS read (same shape the
 * service returns) so the real resolver runs on live data. Demo content
 * below is visibly-marked scaffolding, not copy — never translate it,
 * never A/B test against it.
 */
const DEMO_NAV_INPUT: NavSettings = {
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

export default function HomePage() {
  const resolved = resolveNavSettings({ settings: DEMO_NAV_INPUT, global: null });

  return (
    <div className="min-h-screen">
      <HomeChrome announcement={resolved.announcement} links={resolved.links.items} />
      <main style={{ maxWidth: 960, margin: "0 auto", padding: "28px 24px" }}>
        <h1 className="font-display text-2xl text-[var(--color-ink)]">Storefront home (under construction)</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Chrome above is live (dismiss the bar, flip slides, hover links). Sections land here slice by slice —
          hero first.
        </p>
        <ul className="mt-4 grid gap-2 text-sm">
          <li>
            <a href="/components" style={{ color: "var(--color-accent)", fontWeight: 600 }}>
              Component showcase
            </a>{" "}
            <span className="text-[var(--text-muted)]">— temporary living style guide, deleted at launch</span>
          </li>
          <li>
            <a href="/signin" style={{ color: "var(--color-accent)", fontWeight: 600 }}>
              Sign in
            </a>{" "}
            <span className="text-[var(--text-muted)]">— conversion route, intentionally chromeless</span>
          </li>
        </ul>
      </main>
    </div>
  );
}
