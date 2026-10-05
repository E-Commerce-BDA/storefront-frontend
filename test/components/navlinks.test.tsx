// @vitest-environment jsdom
/**
 * NavLinks contract — labels, hrefs, current token, highlight/badge
 * passthrough, empty renders empty. (AGENTS.md §4 trio, part 1.)
 */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import NavLinks from "@/components/shell/NavLinks";
import type { ResolvedNavLink } from "@/lib/shell/navSettings";

afterEach(cleanup);

const LINKS: ResolvedNavLink[] = [
  { kind: "custom", label: "New in", href: "/new", categoryId: "", icon: "", badge: null, highlight: "none", schedule: { startsAt: "", endsAt: "" }, current: false },
  { kind: "custom", label: "Sale", href: "/sale", categoryId: "", icon: "", badge: { text: "HOT" }, highlight: "sale", schedule: { startsAt: "", endsAt: "" }, current: true },
  { kind: "category", label: "Shoes", href: "/shoes", categoryId: "c1", icon: "", badge: null, highlight: "none", schedule: { startsAt: "", endsAt: "" }, current: false },
];

describe("NavLinks", () => {
  it("renders every label with its href", () => {
    render(<NavLinks links={LINKS} />);
    for (const l of LINKS) {
      const a = screen.getByText(l.label);
      expect(a.tagName).toBe("A");
      expect(a.getAttribute("href")).toBe(l.href);
    }
  });

  it("marks exactly the current link with aria-current=page", () => {
    render(<NavLinks links={LINKS} />);
    const current = screen.getByText("Sale");
    expect(current.getAttribute("aria-current")).toBe("page");
    expect(screen.getByText("New in").hasAttribute("aria-current")).toBe(false);
    expect(screen.getByText("Shoes").hasAttribute("aria-current")).toBe(false);
  });

  it("passes highlight through and renders badges conditionally", () => {
    render(<NavLinks links={LINKS} />);
    expect(screen.getByText("Sale").getAttribute("data-highlight")).toBe("sale");
    expect(screen.getByText("New in").getAttribute("data-highlight")).toBe("none");
    expect(screen.getByText("HOT")).not.toBeNull();
    // Badge carries its paint hook — bare spans are unpaintable (dead-selector class of bug).
    expect(screen.getByText("HOT").className).toContain("sf-navlinks__badge");
    expect(screen.getByText("Shoes").querySelector("span")).toBeNull();
  });

  it("renders an empty nav for an empty array (absent data, absent UI)", () => {
    const { container } = render(<NavLinks links={[]} />);
    expect(container.querySelector("nav")).not.toBeNull();
    expect(container.querySelectorAll("a")).toHaveLength(0);
  });

  it("applies the className escape hatch when given", () => {
    const { container } = render(<NavLinks links={LINKS} className="x" />);
    expect(container.querySelector("nav")?.className).toContain("x");
  });
});
