// @vitest-environment jsdom
/**
 * ProductCollectionSection contract — sections.md §2 (sf-060).
 *
 * `ProductGrid` is mocked (the grid and the island have their own contract
 * tests), so this file asserts only what *this* block decides: the section's card
 * knobs land **under** the product's own `cardSettings`, the admin's gutter
 * becomes the grid's `--grid-gap` var rather than a class, and the CMS layout
 * request reaches the stylesheet as a data attr.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { ProductCardData } from "@/lib/commerce/productCard";
import ProductCollectionSection from "@/components/sections/ProductCollectionSection";
import type { ProductCollectionViewModel } from "@/lib/sections/viewModels";

const harness = vi.hoisted(() => ({ items: [] as unknown[] }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/app/_components/CartProvider", () => ({
  useCart: () => ({ refresh: vi.fn(async () => {}), add: vi.fn() }),
}));
vi.mock("@/components/commerce/ProductGrid", () => ({
  default: (props: { items: unknown[] }) => {
    harness.items = props.items;
    return <ul data-testid="grid">{props.items.map((item, i) => <li key={i} />)}</ul>;
  },
}));

afterEach(() => {
  cleanup();
  harness.items = [];
});

const card = (over: Partial<ProductCardData> = {}): ProductCardData =>
  ({
    id: "p1",
    name: "Ocean Linen Shirt",
    price: 40,
    image: "/media/seed/product-1.jpg",
    category: "Shirts",
    url: "/products/ocean-linen-shirt",
    ...over,
  }) as ProductCardData;

const collection = (over: Partial<ProductCollectionViewModel> = {}): ProductCollectionViewModel =>
  ({
    key: "new-arrivals",
    type: "product_collection",
    title: "New arrivals",
    layout: "grid",
    cards: [card()],
    ...over,
  }) as ProductCollectionViewModel;

const section = () => document.querySelector(".sf-collection") as HTMLElement;
const firstCard = () => harness.items[0] as ProductCardData;

describe("ProductCollectionSection", () => {
  it("hands the resolved cards to the same grid the listing uses", () => {
    render(<ProductCollectionSection model={collection()} />);
    expect(screen.getByTestId("grid")).toBeDefined();
    expect(harness.items).toHaveLength(1);
    expect(firstCard().name).toBe("Ocean Linen Shirt");
  });

  it("puts the section's card knobs *under* the product's own settings", () => {
    render(
      <ProductCollectionSection
        model={collection({
          cardOverrides: { mediaRatio: "3:4", imageBlendMode: "multiply" },
          cards: [card({ cardSettings: { mediaRatio: "1:1" } })],
        })}
      />,
    );
    // The product contradicts the section on the ratio and wins; the blend mode,
    // which the product never mentioned, still comes from the section.
    expect(firstCard().cardSettings).toEqual({ mediaRatio: "1:1", imageBlendMode: "multiply" });
  });

  it("leaves the product's card settings untouched when the section said nothing", () => {
    const original = card({ cardSettings: { mediaRatio: "16:9" } });
    render(<ProductCollectionSection model={collection({ cards: [original] })} />);
    expect(firstCard().cardSettings).toEqual({ mediaRatio: "16:9" });
    expect(firstCard()).toBe(original); // no copy, no new object identity churn
  });

  it("carries an empty collection to the grid rather than painting a hole", () => {
    render(<ProductCollectionSection model={collection({ cards: [] })} />);
    expect(harness.items).toEqual([]);
  });

  it("turns the gutter into the grid's own var and keeps the paint sparse", () => {
    render(<ProductCollectionSection model={collection()} />);
    expect(section().style.getPropertyValue("--grid-gap")).toBe("");
    cleanup();
    render(<ProductCollectionSection model={collection({ gutterPx: 0, bgColor: "#ffffff" })} />);
    // `0` is a real admin answer, so it reaches CSS as `0px` rather than being
    // mistaken for "unset".
    expect(section().style.getPropertyValue("--grid-gap")).toBe("0px");
    expect(section().style.getPropertyValue("--section-bg")).toBe("#ffffff");
  });

  it("publishes the CMS layout as a data attr the stylesheet can hang the rail on", () => {
    render(<ProductCollectionSection model={collection({ layout: "carousel" })} />);
    expect(section().dataset.layout).toBe("carousel");
  });

  it("names the region with the CMS title, and never invents a heading", () => {
    render(<ProductCollectionSection model={collection()} />);
    expect(section().getAttribute("aria-label")).toBe("New arrivals");
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("New arrivals");
    cleanup();
    render(<ProductCollectionSection model={collection({ title: undefined })} />);
    expect(section().getAttribute("aria-label")).toBe("Featured products");
    expect(document.querySelector(".sf-section__title")).toBeNull();
  });
});
