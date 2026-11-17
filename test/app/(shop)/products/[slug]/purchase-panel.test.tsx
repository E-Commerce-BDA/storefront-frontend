// @vitest-environment jsdom
/**
 * PurchasePanel — the PDP buy box (plan §12 islands tier).
 *
 * It composes three controlled blocks and owns the state they report, so the test
 * drives real interaction: selecting a variant must move the price, the stepper
 * must change the submitted quantity, `add` must fire exactly once through the
 * store (with the resolved variant id), and an out-of-stock product must not
 * offer an add at all.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ProductOptionDto, ProductVariantDto } from "@/lib/catalog/schemas";
import PurchasePanel, { type PurchasePanelProps } from "@/app/(shop)/_components/PurchasePanel";

const add = vi.fn(async () => true);
const openDrawer = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/products/ocean-linen-shirt",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/app/_components/WishlistProvider", () => ({ useWishlist: () => ({ has: () => false, toggle: vi.fn(), pendingIds: [] }) }));
vi.mock("@/app/_components/CartProvider", () => ({
  useCart: () => ({ add, openDrawer }),
}));

// `vi.mock` is hoisted above this import, so the panel sees the stubbed cart.
const options: ProductOptionDto[] = [
  {
    id: "o1",
    name: "Color",
    displayType: "text",
    values: [
      { id: "val-blue", value: "Blue" },
      { id: "val-red", value: "Red" },
    ],
  },
];

const variants: ProductVariantDto[] = [
  {
    id: "v-blue",
    sku: "B",
    price: 40,
    stock: 5,
    options: [{ optionId: "o1", optionName: "Color", optionValueId: "val-blue", value: "Blue" }],
  },
  {
    id: "v-red",
    sku: "R",
    price: 45,
    stock: 3,
    options: [{ optionId: "o1", optionName: "Color", optionValueId: "val-red", value: "Red" }],
  },
];

const IMAGES = [{ url: "a.jpg", alt: "Product A" }];

function renderPanel(over: Partial<PurchasePanelProps> = {}) {
  return render(
    <PurchasePanel
      productId="p1"
      name="Ocean Linen Shirt"
      images={IMAGES}
      options={options}
      variants={variants}
      price={40}
      compareAt={55}
      stock={8}
      {...over}
    />,
  );
}

beforeEach(() => {
  add.mockClear();
  openDrawer.mockClear();
});

afterEach(cleanup);

describe("PurchasePanel", () => {
  it("opens on the default variant's price and shows the sale compare-at", () => {
    renderPanel();
    expect(screen.queryByText("$40")).not.toBeNull();
    expect(screen.queryByText("$55")).not.toBeNull();
  });

  it("moves the price when a different variant is selected", () => {
    renderPanel();
    fireEvent.click(screen.getByRole("button", { name: "Red" }));
    expect(screen.queryByText("$45")).not.toBeNull();
    expect(screen.queryByText("$40")).toBeNull();
  });

  it("hides the compare-at when it is not above the shown price", () => {
    renderPanel({ compareAt: 40 });
    // only one "$40" (the price); the struck compare-at is gone
    expect(screen.queryAllByText("$40")).toHaveLength(1);
  });

  it("adds once with the resolved variant id and opens the drawer", async () => {
    renderPanel();
    fireEvent.click(screen.getByRole("button", { name: "Add to cart" }));

    await waitFor(() => expect(add).toHaveBeenCalledTimes(1));
    expect(add).toHaveBeenCalledWith("p1", { variantId: "v-blue", qty: 1 });
    await waitFor(() => expect(openDrawer).toHaveBeenCalled());
  });

  it("submits the stepped quantity", async () => {
    renderPanel();
    fireEvent.click(screen.getByLabelText("Increase quantity"));
    fireEvent.click(screen.getByRole("button", { name: "Add to cart" }));

    await waitFor(() => expect(add).toHaveBeenCalledTimes(1));
    expect(add).toHaveBeenCalledWith("p1", { variantId: "v-blue", qty: 2 });
  });

  it("renders the variant selector when the product carries options", () => {
    const { container } = renderPanel();
    expect(container.querySelector(".sf-variants")).not.toBeNull();
    expect(container.querySelectorAll(".sf-variants__value").length).toBeGreaterThan(0);
  });

  it("paints the buy box on the sf-pdp shell with a compact stepper", () => {
    const { container } = renderPanel();
    // The 60/40 split root and the stepper that must not stretch to full width.
    expect(container.querySelector(".sf-pdp")).not.toBeNull();
    expect(container.querySelector(".sf-pdp .sf-qty")).not.toBeNull();
  });

  it("does not hardcode trust badges — they render as a pdp_trust section", () => {
    const { container } = renderPanel();
    expect(container.textContent).not.toContain("Free shipping");
    expect(container.textContent).not.toContain("Secure checkout");
  });

  it("refuses to add an out-of-stock product", () => {
    renderPanel({ variants: [], options: [], stock: 0 });
    expect(screen.queryByText("Out of stock")).not.toBeNull();
    const button = screen.getByRole("button", { name: "Unavailable" }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    fireEvent.click(button);
    expect(add).not.toHaveBeenCalled();
  });
});
