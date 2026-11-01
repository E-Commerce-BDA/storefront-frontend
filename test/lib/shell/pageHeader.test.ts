/**
 * PageHeader breadcrumb resolver unit — routing.md §2.
 *
 * The one decision the header owns: the final crumb is where you already are, so
 * it is current and not a link, even when the caller pasted an href on it.
 */
import { describe, expect, it } from "vitest";
import { resolveBreadcrumbs } from "@/lib/shell/pageHeader";

describe("resolveBreadcrumbs", () => {
  it("returns an empty trail for nothing/empty", () => {
    expect(resolveBreadcrumbs(undefined)).toEqual([]);
    expect(resolveBreadcrumbs(null)).toEqual([]);
    expect(resolveBreadcrumbs([])).toEqual([]);
  });

  it("marks only the last crumb as current", () => {
    const crumbs = resolveBreadcrumbs([
      { label: "Home", href: "/" },
      { label: "Shoes", href: "/products?category=shoes" },
      { label: "Running X" },
    ]);
    expect(crumbs.map((c) => c.current)).toEqual([false, false, true]);
    expect(crumbs[0].href).toBe("/");
  });

  it("strips the href from the current crumb (you are here is not a link)", () => {
    const crumbs = resolveBreadcrumbs([
      { label: "Home", href: "/" },
      { label: "Cart", href: "/cart" },
    ]);
    expect(crumbs[1]).toEqual({ label: "Cart", current: true });
    expect(crumbs[1].href).toBeUndefined();
  });

  it("drops blank-label crumbs before deciding which is last", () => {
    const crumbs = resolveBreadcrumbs([
      { label: "Home", href: "/" },
      { label: "   " },
      { label: "Detail", href: "/products/x" },
    ]);
    expect(crumbs).toHaveLength(2);
    expect(crumbs[crumbs.length - 1].current).toBe(true);
    expect(crumbs[crumbs.length - 1].label).toBe("Detail");
  });

  it("marks a single crumb as current with no href", () => {
    expect(resolveBreadcrumbs([{ label: "Cart", href: "/cart" }])).toEqual([
      { label: "Cart", current: true },
    ]);
  });
});
