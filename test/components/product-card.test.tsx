// @vitest-environment jsdom
/**
 * ProductCard contract — article root (never button/link), sibling
 * actions (no nesting), CTA clamp to 3, stock/wishlist faces, badge
 * position, hover modes, reserved props inert. Fully controlled.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import ProductCard from "@/components/commerce/ProductCard";
import type { ProductCardData } from "@/lib/commerce/productCard";

afterEach(cleanup);

const P: ProductCardData = {
  id: "p1",
  name: "Ocean Linen Shirt",
  price: 48,
  image: "",
  category: "Shirts",
  tag: "Bestseller",
  rating: 4.8,
  ratingCount: 142,
  compareAt: 60,
};

describe("ProductCard", () => {
  it("renders article root with media, badge, info and sale face", () => {
    const { container } = render(<ProductCard product={P} />);
    expect(container.firstElementChild?.tagName).toBe("ARTICLE");
    expect(screen.getByText("Bestseller")).not.toBeNull();
    expect(screen.getByText("$48")).not.toBeNull();
    expect(screen.getByText("$60").tagName).toBe("S");
    expect(screen.getByText("4.8")).not.toBeNull();
    expect(screen.getByText("(142)")).not.toBeNull();
    expect(container.firstElementChild?.getAttribute("data-badgepos")).toBe("left");
  });

  it("opens via media/name buttons (never nested), actions stop propagation", () => {
    const onOpen = vi.fn();
    const onQuickAdd = vi.fn();
    render(<ProductCard product={P} onOpen={onOpen} onQuickAdd={onQuickAdd} />);
    // No button inside a button (illegal nesting).
    document.querySelectorAll("button").forEach((b) => {
      expect(b.querySelector("button")).toBeNull();
    });
    fireEvent.click(screen.getByRole("button", { name: "Ocean Linen Shirt, $48" }));
    expect(onOpen).toHaveBeenCalledWith(P);
    fireEvent.click(screen.getByRole("button", { name: "Add Ocean Linen Shirt to bag" }));
    expect(onQuickAdd).toHaveBeenCalledWith(P);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("clamps CTA set to 3 and positions badge right", () => {
    render(
      <ProductCard
        product={P}
        badgePosition="right"
        ctaSet={["quick-view", "wishlist", "add-to-cart", "share"]}
      />,
    );
    const group = screen.getByRole("group", { name: "Actions for Ocean Linen Shirt" });
    expect(group.querySelectorAll("button").length).toBe(3);
    expect(group.querySelector('[aria-label="Share Ocean Linen Shirt"]')).toBeNull();
    expect(document.querySelector("article")?.getAttribute("data-badgepos")).toBe("right");
  });

  it("disables everything out of stock, flags low stock", () => {
    const { unmount } = render(<ProductCard product={{ ...P, stock: "out" }} onOpen={() => {}} />);
    expect(document.querySelector("article")?.getAttribute("data-stock")).toBe("out");
    expect(screen.getByText("Sold out")).not.toBeNull();
    (screen.getAllByRole("button") as HTMLButtonElement[]).forEach((b) => {
      expect(b.disabled).toBe(true);
    });
    unmount();
    render(<ProductCard product={{ ...P, stock: "low" }} />);
    expect(screen.getByText("Low stock")).not.toBeNull();
  });

  it("flips wishlist heart when wishlisted; hover-image mode renders swap", () => {
    const { unmount } = render(<ProductCard product={{ ...P, wishlisted: true }} />);
    expect(screen.getByRole("button", { name: "Add Ocean Linen Shirt to wishlist" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    unmount();
    render(<ProductCard product={{ ...P, hoverImage: "h.jpg", hoverMode: "image" }} />);
    expect(document.querySelector("article")?.getAttribute("data-hover")).toBe("image");
    expect(document.querySelector(".sf-productcard__hoverimg")).not.toBeNull();
    expect(screen.queryByRole("group", { name: "Actions for Ocean Linen Shirt" })).toBeNull();
  });

  it("hides badge/ratings/dept on gates; reserved props stay inert", () => {
    render(
      <ProductCard
        product={P}
        showBadge={false}
        showRatings={false}
        showDept={false}
        onQuickView={() => {}}
        onCompare={() => {}}
        onAttribute={() => {}}
      />,
    );
    expect(screen.queryByText("Bestseller")).toBeNull();
    expect(screen.queryByText("4.8")).toBeNull();
    expect(screen.queryByText("Shirts")).toBeNull();
    expect(screen.getByText("Ocean Linen Shirt")).not.toBeNull();
  });
});
