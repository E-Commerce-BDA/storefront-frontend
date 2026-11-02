// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import QuickViewDialog from "@/components/commerce/QuickViewDialog";
import type { ProductCardData } from "@/lib/commerce/productCard";

vi.mock("@/app/_components/WishlistProvider", () => ({
  useWishlist: () => ({
    ids: [],
    pendingIds: [],
    has: () => false,
    toggle: vi.fn(),
  }),
}));

afterEach(cleanup);

const sampleProduct: ProductCardData = {
  id: "prod-1",
  name: "Linen Shirt",
  price: 45,
  compareAt: 60,
  image: "/shirt.jpg",
  category: "Apparel",
  rating: 4.8,
  ratingCount: 42,
  brand: { name: "Studio Nord" },
  options: [
    {
      name: "Color",
      displayType: "swatch",
      showOnCard: true,
      values: [
        { value: "Blue", swatchHex: "#0000ff" },
        { value: "Red", swatchHex: "#ff0000" },
      ],
    },
    {
      name: "Size",
      displayType: "pill",
      showOnCard: true,
      values: [{ value: "S" }, { value: "M" }],
    },
  ],
  cardVariants: [
    {
      id: "var-blue-m",
      sku: "LIN-BLU-M",
      price: 45,
      compareAtPrice: 60,
      stock: 5,
      imageUrl: "/shirt-blue.jpg",
      optionValues: { Color: "Blue", Size: "M" },
    },
    {
      id: "var-red-m",
      sku: "LIN-RED-M",
      price: 52,
      compareAtPrice: 65,
      stock: 0,
      imageUrl: "/shirt-red.jpg",
      optionValues: { Color: "Red", Size: "M" },
    },
  ],
};

describe("QuickViewDialog", () => {
  it("does not render when open is false", () => {
    const { container } = render(
      <QuickViewDialog product={sampleProduct} open={false} onClose={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders product info, price, stock, and handles add to cart", async () => {
    const onAddToCart = vi.fn();
    render(
      <QuickViewDialog
        product={sampleProduct}
        open={true}
        onClose={vi.fn()}
        onAddToCart={onAddToCart}
      />,
    );

    expect(screen.getByText("Studio Nord")).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Linen Shirt" })).not.toBeNull();
    expect(screen.getByText("$45")).not.toBeNull();
    expect(screen.getByText("$60")).not.toBeNull();
    expect(screen.getByText("In stock")).not.toBeNull();

    // Click Add to bag
    fireEvent.click(screen.getByRole("button", { name: "Add to bag" }));
    expect(onAddToCart).toHaveBeenCalledWith("prod-1", "var-blue-m", 1);
  });

  it("switches variant on option selection and reflects out of stock", () => {
    render(
      <QuickViewDialog
        product={sampleProduct}
        open={true}
        onClose={vi.fn()}
      />,
    );

    // Click Red color swatch
    const redSwatch = screen.getByLabelText("Color Red");
    fireEvent.click(redSwatch);

    // Price updates to $52 and stock becomes Out of stock
    expect(screen.getByText("$52")).not.toBeNull();
    expect(screen.getAllByText("Out of stock").length).toBeGreaterThanOrEqual(1);
    const addBtn = screen.getByRole("button", { name: "Out of stock" });
    expect(addBtn.hasAttribute("disabled")).toBe(true);
  });
});
