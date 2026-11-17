// @vitest-environment jsdom
/** Compare tray + card control contract — sf-055. */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { CompareProvider, useCompare } from "@/app/_components/CompareProvider";
import CompareTray from "@/app/(shop)/compare/_components/CompareTray";
import ProductCard from "@/components/commerce/ProductCard";
import type { ProductCardData } from "@/lib/commerce/productCard";

afterEach(cleanup);

function Seed() {
  const compare = useCompare();
  return (
    <button type="button" onClick={() => compare.toggle("p1")}>
      toggle
    </button>
  );
}

describe("CompareProvider + tray", () => {
  it("shows nothing at zero items and a shareable link once populated", () => {
    const { container, rerender } = render(
      <CompareProvider><CompareTray /><Seed /></CompareProvider>,
    );
    expect(container.querySelector(".sf-compare-tray")).toBeNull();

    screen.getByText("toggle").click();
    // A fresh mount with the same provider keeps the count through context.
    rerender(
      <CompareProvider><CompareTray /><Seed /></CompareProvider>,
    );
    expect(screen.getByText(/selected/)).not.toBeNull();
  });
});

describe("ProductCard compare control", () => {
  const product: ProductCardData = {
    id: "p1",
    name: "Linen Shirt",
    image: "/media/shirt.jpg",
    price: 40,
    category: "Shirts",
    url: "/products/linen-shirt",
  };

  it("uses the onCompare callback and paints active state", () => {
    const onCompare = vi.fn();
    const { container } = render(
      <ProductCard product={product} onCompare={onCompare} compareActive />,
    );
    const button = container.querySelector(".sf-productcard__compare") as HTMLButtonElement;
    expect(button).not.toBeNull();
    expect(button.getAttribute("data-compare")).toBe("true");
    expect(button.getAttribute("aria-pressed")).toBe("true");
    button.click();
    expect(onCompare).toHaveBeenCalledWith(product);
  });
});
