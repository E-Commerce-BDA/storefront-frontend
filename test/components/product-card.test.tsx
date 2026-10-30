// @vitest-environment jsdom
/**
 * ProductCard contract — article root (never button/link), sibling
 * actions (no nesting), CTA clamp to 3, stock/wishlist faces, badge
 * position, hover modes, card types, blend modes, reserved props inert.
 * Fully controlled.
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
    expect(container.firstElementChild?.getAttribute("data-card-type")).toBe("standard");
    expect(container.firstElementChild?.getAttribute("data-blend-mode")).toBe("normal");
  });

  it("opens via media/name buttons (never nested), actions stop propagation", () => {
    const onOpen = vi.fn();
    const onQuickAdd = vi.fn();
    const { container } = render(<ProductCard product={P} onOpen={onOpen} onQuickAdd={onQuickAdd} />);
    // No button inside a button (illegal nesting).
    container.querySelectorAll("button").forEach((b) => {
      expect(b.querySelector("button")).toBeNull();
    });
    // Media + name share the label (both open) — click the first.
    const openers = screen.getAllByRole("button", { name: "Ocean Linen Shirt, $48" });
    expect(openers.length).toBe(2);
    fireEvent.click(openers[0]);
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
    const first = render(<ProductCard product={{ ...P, wishlisted: true }} />);
    expect(
      first.container.querySelector('[aria-label="Add Ocean Linen Shirt to wishlist"]')?.getAttribute("aria-pressed"),
    ).toBe("true");
    first.unmount();
    const second = render(<ProductCard product={{ ...P, hoverImage: "h.jpg" }} hoverMode="image" />);
    expect(second.container.firstElementChild?.getAttribute("data-hover")).toBe("image");
    expect(second.container.querySelector(".sf-productcard__hoverimg")).not.toBeNull();
    expect(screen.queryByRole("group", { name: "Actions for Ocean Linen Shirt" })).toBeNull();
    second.unmount();
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

  it("honors cardType, imageBlendMode, textAlign and independent border radii", () => {
    const { container } = render(
      <ProductCard
        product={P}
        cardType="overlay"
        imageBlendMode="multiply"
        textAlign="center"
        borderRadius={12}
        imageBorderRadius={6}
      />,
    );
    const article = container.firstElementChild as HTMLElement;
    expect(article.getAttribute("data-card-type")).toBe("overlay");
    expect(article.getAttribute("data-blend-mode")).toBe("multiply");
    expect(article.getAttribute("data-align")).toBe("center");
    expect(article.style.getPropertyValue("--pc-radius")).toBe("12px");
    expect(article.style.getPropertyValue("--pc-media-radius")).toBe("6px");
    expect(article.style.getPropertyValue("--pc-image-blend")).toBe("multiply");
  });

  it("merges styleConfig with flat prop overrides (flat wins)", () => {
    const { container } = render(
      <ProductCard
        product={P}
        styleConfig={{ cardType: "minimal", borderRadius: 8, mediaRatio: "1:1" }}
        cardType="horizontal"
      />,
    );
    const article = container.firstElementChild as HTMLElement;
    expect(article.getAttribute("data-card-type")).toBe("horizontal");
    expect(article.style.getPropertyValue("--pc-radius")).toBe("8px");
    expect(article.style.getPropertyValue("--pc-ratio")).toBe("1 / 1");
  });

  it("renders hover zoom mode", () => {
    const { container } = render(<ProductCard product={P} hoverMode="zoom" />);
    expect(container.firstElementChild?.getAttribute("data-hover")).toBe("zoom");
  });

  it("renders centralized resolved badges from registry (max 3)", () => {
    const productWithBadges: ProductCardData = {
      ...P,
      badges: [
        { id: "b1", key: "sale", label: "Sale 20%", bg: "#e11d48", textColor: "#ffffff" },
        { id: "b2", key: "new", label: "New Arrival", bg: "#0284c7", textColor: "#ffffff" },
        { id: "b3", key: "eco", label: "Organic", bg: "#166534", textColor: "#dcfce7" },
        { id: "b4", key: "extra", label: "Extra Badge", bg: "#000000", textColor: "#ffffff" },
      ],
    };

    render(<ProductCard product={productWithBadges} />);
    expect(screen.getByText("Sale 20%")).not.toBeNull();
    expect(screen.getByText("New Arrival")).not.toBeNull();
    expect(screen.getByText("Organic")).not.toBeNull();
    // Clamped to 3
    expect(screen.queryByText("Extra Badge")).toBeNull();
  });

  it("renders CTA action bar variants: below, inline, footer, none", () => {
    // Below variant
    const below = render(<ProductCard product={P} ctaVariant="below" />);
    expect(below.container.querySelector(".sf-productcard__ctas--below")).not.toBeNull();
    below.unmount();

    // Inline variant
    const inline = render(<ProductCard product={P} ctaVariant="inline" />);
    expect(inline.container.querySelector(".sf-productcard__ctas--inline")).not.toBeNull();
    inline.unmount();

    // Footer variant
    const footer = render(<ProductCard product={P} ctaVariant="footer" />);
    expect(footer.container.querySelector(".sf-productcard__ctas--footer")).not.toBeNull();
    footer.unmount();

    // None variant
    const none = render(<ProductCard product={P} ctaVariant="none" />);
    expect(none.container.querySelector(".sf-productcard__ctas")).toBeNull();
    none.unmount();
  });

  it("renders CTA action styles: icon, label, icon-label", () => {
    const withLabels = render(<ProductCard product={P} ctaVariant="below" ctaStyle="icon-label" />);
    expect(screen.getByText("Quick view")).not.toBeNull();
    expect(screen.getByText("Wishlist")).not.toBeNull();
    expect(screen.getByText("Add to bag")).not.toBeNull();
    withLabels.unmount();
  });

  it("renders color swatches and size pills with interactive selection", () => {
    const onSelectOption = vi.fn();
    const productWithOptions: ProductCardData = {
      ...P,
      options: [
        {
          name: "Color",
          displayType: "swatch",
          showOnCard: true,
          values: [
            { value: "Navy", swatchHex: "#000080" },
            { value: "Ruby", swatchHex: "#e0115f" },
          ],
        },
        {
          name: "Size",
          displayType: "pill",
          showOnCard: true,
          values: [{ value: "S" }, { value: "M" }, { value: "L" }],
        },
      ],
    };

    const { container } = render(
      <ProductCard
        product={productWithOptions}
        selectedOptions={{ Color: "Navy", Size: "M" }}
        onSelectOption={onSelectOption}
      />,
    );

    // Color Swatches
    const swatches = container.querySelectorAll(".sf-productcard__swatch");
    expect(swatches.length).toBe(2);
    const navySwatch = container.querySelector('[aria-label="Color: Navy"]');
    expect(navySwatch?.getAttribute("aria-checked")).toBe("true");
    expect(navySwatch?.classList.contains("sf-productcard__swatch--active")).toBe(true);

    const rubySwatch = container.querySelector('[aria-label="Color: Ruby"]');
    if (rubySwatch) fireEvent.click(rubySwatch);
    expect(onSelectOption).toHaveBeenCalledWith("Color", "Ruby");

    // Size Pills
    const mPill = screen.getByRole("radio", { name: "Size: M" });
    expect(mPill.getAttribute("aria-checked")).toBe("true");
    expect(mPill.classList.contains("sf-productcard__pill--active")).toBe(true);

    const lPill = screen.getByRole("radio", { name: "Size: L" });
    fireEvent.click(lPill);
    expect(onSelectOption).toHaveBeenCalledWith("Size", "L");
  });

  it("honors sparse per-product cardSettings overrides", () => {
    const productWithSettings: ProductCardData = {
      ...P,
      cardSettings: {
        cardType: "compact",
        ctaVariant: "footer",
      },
    };

    const { container } = render(<ProductCard product={productWithSettings} />);
    const article = container.firstElementChild as HTMLElement;
    expect(article.getAttribute("data-card-type")).toBe("compact");
    expect(article.getAttribute("data-ctavariant")).toBe("footer");
    expect(container.querySelector(".sf-productcard__ctas--footer")).not.toBeNull();
  });
});
