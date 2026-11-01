// @vitest-environment jsdom
/**
 * PageHeader contract — shell-cart.md §3, routing.md §2.
 *
 * Proves the block fills exactly the slots it is handed: a real `<h1>`, an
 * optional eyebrow, a breadcrumb `<nav>` whose last crumb is `aria-current` and
 * not a link, and an actions slot that renders whatever the caller passed.
 */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import PageHeader from "@/components/shell/PageHeader";

afterEach(cleanup);

describe("PageHeader", () => {
  it("renders the title as the page heading and no nav when there is no trail", () => {
    render(<PageHeader title="Cart" />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Cart");
    expect(screen.queryByRole("navigation", { name: "Breadcrumb" })).toBeNull();
  });

  it("renders the eyebrow only when provided", () => {
    const { container, rerender } = render(<PageHeader title="Cart" />);
    expect(container.querySelector(".sf-page-header__eyebrow")).toBeNull();
    rerender(<PageHeader title="Cart" eyebrow="Your bag" />);
    expect(container.querySelector(".sf-page-header__eyebrow")?.textContent).toBe("Your bag");
  });

  it("renders a labelled breadcrumb with links and a non-link current crumb", () => {
    render(
      <PageHeader
        title="Running X"
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Shoes", href: "/products?category=shoes" },
          { label: "Running X", href: "/products/running-x" },
        ]}
      />,
    );
    const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
    const links = nav.querySelectorAll("a");
    expect(links).toHaveLength(2); // the current crumb dropped its link
    const current = nav.querySelector('[aria-current="page"]') as HTMLElement;
    expect(current.textContent).toBe("Running X");
    expect(current.tagName).toBe("SPAN");
  });

  it("renders an actions slot the caller owns", () => {
    render(<PageHeader title="Cart" actions={<button type="button">Clear cart</button>} />);
    expect(screen.getByRole("button", { name: "Clear cart" })).not.toBeNull();
  });
});
