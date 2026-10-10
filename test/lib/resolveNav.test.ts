/**
 * Navbar resolver-unit — cascade, time-filter, truncate, clamps.
 * Pure in → complete out; clock injected via `now` (no Date mocking).
 */
import { describe, expect, it } from "vitest";
import { DEFAULT_NAV_SETTINGS } from "@/lib/shell/navSettings";
import { resolveNavSettings } from "@/lib/shell/resolveNav";

const NOW = Date.parse("2026-10-05T12:00:00Z");

describe("resolveNavSettings", () => {
  it("resolves today's look out of nothing", () => {
    expect(resolveNavSettings({}, NOW)).toEqual(DEFAULT_NAV_SETTINGS);
  });

  it("treats null scopes as misses (CMS down renders builtins)", () => {
    expect(resolveNavSettings({ settings: null, global: null }, NOW)).toEqual(DEFAULT_NAV_SETTINGS);
  });

  it("shared wins over global, clamps apply", () => {
    const r = resolveNavSettings(
      {
        global: { bar: { height: 10 }, links: { maxItems: 99 } },
        settings: { shared: { bar: { height: 72 }, logo: { height: 200 } } },
      },
      NOW,
    );
    expect(r.bar.height).toBe(72);
    expect(r.links.maxItems).toBe(8);
    expect(r.logo.height).toBe(40);
  });

  it("drops out-of-window links, keeps malformed bounds (strict-drop)", () => {
    const r = resolveNavSettings(
      {
        settings: {
          shared: {
            links: {
              items: [
                { kind: "custom", label: "Live", href: "/live" },
                { kind: "custom", label: "Expired", href: "/old", schedule: { endsAt: "2026-10-01T00:00:00Z" } },
                { kind: "custom", label: "Upcoming", href: "/soon", schedule: { startsAt: "2026-12-01T00:00:00Z" } },
                { kind: "custom", label: "Broken", href: "/broken", schedule: { startsAt: "not-a-date" } },
              ],
            },
          },
        },
      },
      NOW,
    );
    expect(r.links.items.map((l) => l.label)).toEqual(["Live", "Broken"]);
  });

  it("truncates to maxItems keeping order, fills link defaults", () => {
    const r = resolveNavSettings(
      {
        settings: {
          shared: {
            links: {
              maxItems: 3,
              items: [
                { kind: "category", label: "A", href: "/a", categoryId: "c1" },
                { kind: "category", label: "B", href: "/b", categoryId: "c2" },
                { kind: "category", label: "C", href: "/c", categoryId: "c3" },
                { kind: "category", label: "D", href: "/d", categoryId: "c4" },
              ],
            },
          },
        },
      },
      NOW,
    );
    expect(r.links.items.map((l) => l.label)).toEqual(["A", "B", "C"]);
    expect(r.links.items[0]).toMatchObject({ icon: "", badge: null, highlight: "none", current: false });
  });

  it("clamps maxItems to the locked 3–8 range", () => {
    const low = resolveNavSettings({ settings: { shared: { links: { maxItems: 2 } } } }, NOW);
    expect(low.links.maxItems).toBe(3);
    const high = resolveNavSettings({ settings: { shared: { links: { maxItems: 99 } } } }, NOW);
    expect(high.links.maxItems).toBe(8);
  });

  it("defaults collapseAnimation on, honors explicit off", () => {
    expect(resolveNavSettings({}, NOW).announcement.collapseAnimation).toBe(true);
    const r = resolveNavSettings({ settings: { shared: { announcement: { collapseAnimation: false } } } }, NOW);
    expect(r.announcement.collapseAnimation).toBe(false);
  });

  it("resolves announcement items with per-item countdown, drops empties", () => {
    const r = resolveNavSettings(
      {
        settings: {
          shared: {
            announcement: {
              items: [
                { text: "Diwali sale", cta: { label: "Shop", href: "/sale" }, countdownTo: "2026-10-20T00:00:00Z" },
                { text: "" },
              ],
            },
          },
        },
      },
      NOW,
    );
    expect(r.announcement.items).toHaveLength(1);
    expect(r.announcement.items[0]).toEqual({
      text: "Diwali sale",
      cta: { label: "Shop", href: "/sale" },
      countdownTo: "2026-10-20T00:00:00Z",
    });
    expect(r.announcement.showArrows).toBe(true);
    expect(r.announcement.autoplayMs).toBeNull();
  });
});
