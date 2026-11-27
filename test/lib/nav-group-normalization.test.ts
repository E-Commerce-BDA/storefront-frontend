import { describe, expect, it } from "vitest";
import { navResponseSchema, type MegaMenuGroup } from "@ecom/contracts";
import { normalizeNavGroups, resolveMegaMenu } from "@/lib/shell/megaMenuModel";
import { markCurrentNavLinks, resolveNavSettings } from "@/lib/shell/resolveNav";
import type { NavLink, NavSettings } from "@/lib/shell/navSettings";

const link = (groups: unknown): NavLink =>
  ({
    kind: "custom",
    label: "Clothing",
    href: "/products",
    groups,
  }) as NavLink;

describe("nav group normalization (sf-089)", () => {
  it("drops malformed groups and items, rejecting unsafe hrefs", () => {
    const raw = [
      null,
      { title: "", items: [{ label: "X", href: "/x" }] },
      { title: "Empty", items: [] },
      {
        title: "Shop",
        items: [
          { label: "Tops", href: "/products/tops" },
          { label: "", href: "/blank" },
          { label: "Script", href: "javascript:alert(1)" },
          { label: "Protocol-relative", href: "//evil.example" },
          null,
        ],
      },
    ];
    const groups = normalizeNavGroups(raw);
    expect(groups).toHaveLength(1);
    expect(groups[0].title).toBe("Shop");
    expect(groups[0].items.map((item) => item.href)).toEqual(["/products/tops"]);
  });

  it("dedupes by href, clamps columns and caps the group/item budget", () => {
    const raw = Array.from({ length: 8 }, (_, i) => ({
      title: `Group ${i}`,
      columns: 99,
      items: Array.from({ length: 14 }, (_, j) => ({ label: `L${j}`, href: `/g${i}/${j % 5}` })),
    }));
    const groups = normalizeNavGroups(raw);
    expect(groups).toHaveLength(6);
    expect(groups[0].columns).toBe(4);
    expect(groups[0].items).toHaveLength(5);
    expect(new Set(groups[0].items.map((item) => item.href)).size).toBe(5);
  });

  it("preserves a valid promo only with a safe href", () => {
    const good = normalizeNavGroups([
      { title: "Sale", items: [{ label: "All", href: "/sale" }], promo: { title: "Drop", href: "https://example.com/drop" } },
    ]);
    expect(good[0].promo?.href).toBe("https://example.com/drop");
    const bad = normalizeNavGroups([
      { title: "Sale", items: [{ label: "All", href: "/sale" }], promo: { title: "Drop", href: "data:text/html,x" } },
    ]);
    expect(bad[0].promo).toBeUndefined();
  });

  it("feeds the normalized shape into the mega-menu and nav resolvers", () => {
    const resolved = resolveMegaMenu(
      [{ title: "Shop", columns: 12, items: [{ label: "All", href: "/products" }] }] as MegaMenuGroup[],
      undefined,
    );
    expect(resolved.groups[0].columns).toBe(4);
    const settings = resolveNavSettings({ settings: { shared: { links: { items: [link([
      { title: "Shop", columns: 0, items: [{ label: "All", href: "/products" }] },
    ])] } } } });
    expect(settings.links.items[0].groups?.[0].columns).toBe(1);
    expect(settings.links.items[0].groups?.[0].items).toHaveLength(1);
    // An entirely invalid nav group cannot become a trigger.
    const invalid = resolveNavSettings({ settings: { shared: { links: { items: [link([{ title: "", items: [] }])] } } } });
    expect(invalid.links.items[0].groups).toEqual([]);
  });

  it("survives a parsed 2.2.0 CMS response all the way to resolved nav links", () => {
    // Same seam as lib/cms/client.ts parseSettings: contracts validates the
    // envelope, the storefront resolver consumes the typed payload.
    const response = navResponseSchema.parse({
      version: 2,
      navbar: {
        shared: {
          links: {
            items: [
              {
                kind: "custom",
                label: "Clothing",
                href: "/products",
                groups: [
                  {
                    title: "Tops",
                    columns: 2,
                    items: [{ label: "Tees", href: "/products/tees" }],
                    promo: { title: "New season", href: "/products/new" },
                  },
                ],
              },
            ],
          },
        },
      },
    });
    const resolved = resolveNavSettings({ settings: response.navbar as unknown as NavSettings });
    const groups = resolved.links.items[0].groups ?? [];
    expect(groups).toHaveLength(1);
    expect(groups[0].columns).toBe(2);
    expect(groups[0].promo?.title).toBe("New season");
    expect(groups[0].items[0].href).toBe("/products/tees");
  });

  it("marks the current link and its parents without marking the root", () => {
    const links = resolveNavSettings({
      settings: { shared: { links: { items: [link([]), { ...link([]), label: "Home", href: "/" }] } } },
    }).links.items;
    const marked = markCurrentNavLinks(links, "/products/tops?sort=price");
    expect(marked[0].current).toBe(true);
    expect(marked[1].current).toBe(false);
    expect(markCurrentNavLinks(links, "/")[1].current).toBe(true);
  });
});
