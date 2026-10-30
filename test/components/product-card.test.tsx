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
    const second = render(<ProductCard product={{ ...P, hoverImage: "h.jpg" }} hoverMode="image" ctaVariant="none" />);
    expect(second.container.firstElementChild?.getAttribute("data-hover")).toBe("image");
    expect(second.container.querySelector(".sf-productcard__hoverimg")).not.toBeNull();
    expect(screen.queryByRole("group", { name: "Actions for Ocean Linen Shirt" })).toBeNull();
    second.unmount();
    // Decoupled overlay CTAs render even when hoverMode is image
    const third = render(<ProductCard product={{ ...P, hoverImage: "h.jpg" }} hoverMode="image" ctaVariant="overlay" />);
    expect(third.container.querySelector(".sf-productcard__ctas")).not.toBeNull();
    third.unmount();
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

  it("renders multi-image carousel arrows and indicators with index callbacks", () => {
    const onImageIndexChange = vi.fn();
    const productWithImages: ProductCardData = {
      ...P,
      images: [
        { url: "img1.jpg" },
        { url: "img2.jpg" },
        { url: "img3.jpg" },
      ],
    };

    const { container } = render(
      <ProductCard
        product={productWithImages}
        activeImageIndex={1}
        onImageIndexChange={onImageIndexChange}
        imageNav="hover"
        imageIndicator="dots"
      />,
    );

    const prevBtn = screen.getByRole("button", { name: "Previous image" });
    const nextBtn = screen.getByRole("button", { name: "Next image" });
    expect(prevBtn).not.toBeNull();
    expect(nextBtn).not.toBeNull();

    // Prev button changes index to 0
    fireEvent.click(prevBtn);
    expect(onImageIndexChange).toHaveBeenCalledWith(0);

    // Next button changes index to 2
    fireEvent.click(nextBtn);
    expect(onImageIndexChange).toHaveBeenCalledWith(2);

    // Indicator dots
    const dots = container.querySelectorAll(".sf-productcard__indicator-dot");
    expect(dots.length).toBe(3);
    expect(dots[1].classList.contains("sf-productcard__indicator-dot--active")).toBe(true);

    // Clicking dot 2
    fireEvent.click(dots[2]);
    expect(onImageIndexChange).toHaveBeenCalledWith(2);
  });

  it("places options into info, media, brand-hover, and media-hover-top slots", () => {
    const productWithSlots: ProductCardData = {
      ...P,
      brand: { name: "Oceanic Brand" },
      options: [
        {
          name: "Color",
          displayType: "swatch",
          showOnCard: true,
          cardPlacement: "brand-hover",
          values: [{ value: "Navy", swatchHex: "#000080" }],
        },
        {
          name: "Size",
          displayType: "pill",
          showOnCard: true,
          cardPlacement: "media-hover-top",
          values: [{ value: "M" }],
        },
        {
          name: "Material",
          displayType: "pill",
          showOnCard: true,
          cardPlacement: "media",
          values: [{ value: "Linen" }],
        },
        {
          name: "Fit",
          displayType: "pill",
          showOnCard: true,
          cardPlacement: "info",
          values: [{ value: "Regular" }],
        },
        {
          name: "HiddenOpt",
          displayType: "pill",
          showOnCard: false,
          cardPlacement: "hidden",
          values: [{ value: "Secret" }],
        },
      ],
    };

    const { container } = render(
      <ProductCard product={productWithSlots} eyebrow="brand" />,
    );

    // Brand eyebrow
    expect(screen.getByText("Oceanic Brand")).not.toBeNull();

    // brand-hover slot
    expect(container.querySelector(".sf-productcard__brand-hover-slot [aria-label='Color: Navy']")).not.toBeNull();

    // media-hover-top slot
    expect(container.querySelector(".sf-productcard__media-hover-top [aria-label='Size: M']")).not.toBeNull();

    // media slot
    expect(container.querySelector(".sf-productcard__media-options [aria-label='Material: Linen']")).not.toBeNull();

    // info slot
    expect(container.querySelector(".sf-productcard__options [aria-label='Fit: Regular']")).not.toBeNull();

    // hidden slot
    expect(screen.queryByLabelText("HiddenOpt: Secret")).toBeNull();
  });

  it("applies selection effects on catalog grid: image, price, stock update", () => {
    const productWithVariants: ProductCardData = {
      ...P,
      image: "default.jpg",
      price: 48,
      compareAt: 60,
      cardVariants: [
        {
          id: "v-ruby",
          sku: "SHIRT-RUBY-M",
          price: 54,
          compareAtPrice: 70,
          stock: 3,
          imageUrl: "ruby.jpg",
          optionValues: { Color: "Ruby", Size: "M" },
        },
        {
          id: "v-out",
          sku: "SHIRT-NAVY-XL",
          price: 40,
          stock: 0,
          imageUrl: "out.jpg",
          optionValues: { Color: "Navy", Size: "XL" },
        },
      ],
      options: [
        {
          name: "Color",
          displayType: "swatch",
          showOnCard: true,
          values: [{ value: "Ruby" }, { value: "Navy" }],
        },
        {
          name: "Size",
          displayType: "pill",
          showOnCard: true,
          values: [{ value: "M" }, { value: "XL" }],
        },
      ],
    };

    // When Ruby + M is selected
    const { container, rerender } = render(
      <ProductCard
        product={productWithVariants}
        selectedOptions={{ Color: "Ruby", Size: "M" }}
        selectionEffects={["image", "price", "stock"]}
      />,
    );

    const img = container.querySelector(".sf-productcard__cover") as HTMLImageElement;
    expect(img.src).toContain("ruby.jpg");
    expect(screen.getByText("$54")).not.toBeNull();
    expect(screen.getByText("$70")).not.toBeNull();
    expect(screen.getByText("Low stock")).not.toBeNull();

    // When Navy + XL is selected (stock=0 -> out of stock)
    rerender(
      <ProductCard
        product={productWithVariants}
        selectedOptions={{ Color: "Navy", Size: "XL" }}
        selectionEffects={["image", "price", "stock"]}
      />,
    );

    expect(screen.getByText("Sold out")).not.toBeNull();
    expect(container.querySelector("article")?.getAttribute("data-stock")).toBe("out");
  });

  it("triggers onPreviewOption on swatch mouse enter/leave when selectionMode=preview", () => {
    const onPreviewOption = vi.fn();
    const productWithOptions: ProductCardData = {
      ...P,
      options: [
        {
          name: "Color",
          displayType: "swatch",
          showOnCard: true,
          values: [{ value: "Emerald", swatchHex: "#00ff00" }],
        },
      ],
    };

    const { container } = render(
      <ProductCard
        product={productWithOptions}
        selectionMode="preview"
        onPreviewOption={onPreviewOption}
      />,
    );

    const swatch = container.querySelector(".sf-productcard__swatch") as HTMLButtonElement;
    fireEvent.mouseEnter(swatch);
    expect(onPreviewOption).toHaveBeenCalledWith("Color", "Emerald");

    fireEvent.mouseLeave(swatch);
    expect(onPreviewOption).toHaveBeenCalledWith("Color", null);
  });

  it("supports Arrow keyboard navigation between option values in radiogroup", () => {
    const onSelectOption = vi.fn();
    const productWithOptions: ProductCardData = {
      ...P,
      options: [
        {
          name: "Size",
          displayType: "pill",
          showOnCard: true,
          values: [{ value: "S" }, { value: "M" }, { value: "L" }],
        },
      ],
    };

    render(
      <ProductCard
        product={productWithOptions}
        selectedOptions={{ Size: "S" }}
        onSelectOption={onSelectOption}
      />,
    );

    const sPill = screen.getByRole("radio", { name: "Size: S" });
    expect(sPill.getAttribute("tabIndex")).toBe("0");
    const mPill = screen.getByRole("radio", { name: "Size: M" });
    expect(mPill.getAttribute("tabIndex")).toBe("-1");

    fireEvent.keyDown(sPill, { key: "ArrowRight" });
    expect(onSelectOption).toHaveBeenCalledWith("Size", "M");

    fireEvent.keyDown(sPill, { key: "ArrowLeft" });
    expect(onSelectOption).toHaveBeenCalledWith("Size", "L");
  });

  it("renders imageFit='contain' with data-fit='contain' and sets --pc-image-fit var", () => {
    const { container, unmount } = render(<ProductCard product={P} imageFit="contain" />);
    const article = container.firstElementChild as HTMLElement;
    expect(article.getAttribute("data-fit")).toBe("contain");
    expect(article.style.getPropertyValue("--pc-image-fit")).toBe("contain");
    unmount();

    const { container: defaultContainer } = render(<ProductCard product={P} />);
    const defaultArticle = defaultContainer.firstElementChild as HTMLElement;
    expect(defaultArticle.getAttribute("data-fit")).toBe("cover");
    expect(defaultArticle.style.getPropertyValue("--pc-image-fit")).toBe("cover");
  });

  it("renders vertical tabs list layout for label and icon-label CTA styles", () => {
    const { container, unmount } = render(
      <ProductCard
        product={P}
        ctaVariant="below"
        ctaStyle="icon-label"
        ctaPosition="left"
      />,
    );
    const article = container.firstElementChild as HTMLElement;
    expect(article.getAttribute("data-ctastyle")).toBe("icon-label");
    expect(article.getAttribute("data-ctapos")).toBe("left");
    expect(article.getAttribute("data-ctavariant")).toBe("below");

    const ctas = container.querySelector(".sf-productcard__ctas--below");
    expect(ctas).not.toBeNull();
    const ctaBtns = ctas?.querySelectorAll(".sf-productcard__cta");
    expect(ctaBtns?.length).toBe(3);
    expect(ctas?.textContent).toContain("Quick view");
    expect(ctas?.textContent).toContain("Add to bag");
    unmount();

    const { container: labelContainer } = render(
      <ProductCard product={P} ctaVariant="below" ctaStyle="label" />,
    );
    const labelArticle = labelContainer.firstElementChild as HTMLElement;
    expect(labelArticle.getAttribute("data-ctastyle")).toBe("label");
  });

  it("renders non-overlay CTAs (below, inline, footer) with correct variant classes", () => {
    const { container: belowC } = render(<ProductCard product={P} ctaVariant="below" />);
    expect(belowC.querySelector(".sf-productcard__ctas--below")).not.toBeNull();

    const { container: inlineC } = render(<ProductCard product={P} ctaVariant="inline" />);
    expect(inlineC.querySelector(".sf-productcard__ctas--inline")).not.toBeNull();

    const { container: footerC } = render(<ProductCard product={P} ctaVariant="footer" />);
    expect(footerC.querySelector(".sf-productcard__ctas--footer")).not.toBeNull();
  });

  it("uses the Button component with sf-btn class and supports ctaBg, ctaTextColor, ctaBorderColor", () => {
    const { container } = render(
      <ProductCard
        product={P}
        ctaVariant="below"
        ctaBg="#0077B6"
        ctaTextColor="#FFFFFF"
        ctaBorderColor="#005B8C"
      />,
    );
    const article = container.firstElementChild as HTMLElement;
    expect(article.style.getPropertyValue("--pc-cta-bg")).toBe("#0077B6");
    expect(article.style.getPropertyValue("--pc-cta-text")).toBe("#FFFFFF");
    expect(article.style.getPropertyValue("--pc-cta-border")).toBe("#005B8C");

    const btn = container.querySelector(".sf-productcard__cta") as HTMLElement;
    expect(btn.classList.contains("sf-btn")).toBe(true);
    expect(btn.style.getPropertyValue("--btn-bg")).toBe("#0077B6");
    expect(btn.style.getPropertyValue("--btn-text")).toBe("#FFFFFF");
    expect(btn.style.getPropertyValue("--btn-border")).toBe("#005B8C");
  });

  it("supports ctaIconPosition='center' and 'bottom' data attribute on article", () => {
    const { container: centerC, unmount } = render(
      <ProductCard product={P} ctaStyle="icon" ctaIconPosition="center" />,
    );
    expect(centerC.firstElementChild?.getAttribute("data-cta-icon-pos")).toBe("center");
    unmount();

    const { container: bottomC } = render(
      <ProductCard product={P} ctaStyle="icon" ctaIconPosition="bottom" />,
    );
    expect(bottomC.firstElementChild?.getAttribute("data-cta-icon-pos")).toBe("bottom");
  });
});
