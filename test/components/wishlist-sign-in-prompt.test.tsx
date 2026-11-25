// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import WishlistSignInPrompt from "@/components/commerce/WishlistSignInPrompt";
import { resolveWishlistGuestPrompt } from "@/lib/wishlist/prompt";

afterEach(cleanup);

const MODEL = resolveWishlistGuestPrompt("/products/linen-shirt", { productName: "Linen Shirt" });

describe("WishlistSignInPrompt contract (sf-056)", () => {
  it("names the pending product and links to sign-in with the return path", () => {
    render(<WishlistSignInPrompt model={MODEL} onDismiss={vi.fn()} />);
    expect(screen.getByRole("dialog", { name: "Sign in to save this item" })).not.toBeNull();
    expect(screen.getByText("Linen Shirt").getAttribute("data-product-name")).toBe("Linen Shirt");
    const link = screen.getByRole("link", { name: "Sign in" });
    expect(link.getAttribute("href")).toBe("/signin?next=%2Fproducts%2Flinen-shirt");
  });

  it("dismisses from the cancel button, the backdrop and the link", () => {
    const onDismiss = vi.fn();
    const { container } = render(<WishlistSignInPrompt model={MODEL} onDismiss={onDismiss} />);
    screen.getByRole("button", { name: "Not now" }).click();
    (container.querySelector(".sf-wishlist-prompt__backdrop") as HTMLElement).click();
    screen.getByRole("link", { name: "Sign in" }).click();
    expect(onDismiss).toHaveBeenCalledTimes(3);
  });
});
