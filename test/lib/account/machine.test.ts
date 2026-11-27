import { describe, expect, it } from "vitest";
import { accountTabsMachine, initialAccountTabsMachine } from "@/lib/account/machine";
import { initialPdpMachine, pdpMachine } from "@/lib/pdp/machine";

describe("account tab machine", () => {
  it("moves between all six prototype locations and ignores a no-op", () => {
    let state = initialAccountTabsMachine();
    expect(state.tab).toBe("overview");
    for (const event of [
      { type: "ORDERS" },
      { type: "ORDER_DETAIL" },
      { type: "ADDRESSES" },
      { type: "WISHLIST" },
      { type: "PROFILE" },
      { type: "OVERVIEW" },
    ] as const) {
      state = accountTabsMachine(state, event);
    }
    expect(state.tab).toBe("overview");
    const orders = accountTabsMachine(state, { type: "ORDERS" });
    expect(accountTabsMachine(orders, { type: "ORDERS" })).toBe(orders);
  });
});

describe("pdp tab machine", () => {
  it("keeps the tab with the product selection and resets it on a product change", () => {
    const reviews = pdpMachine(initialPdpMachine("a"), { type: "tab/set", tab: "reviews" });
    expect(reviews.tab).toBe("reviews");
    expect(pdpMachine(reviews, { type: "tab/set", tab: "reviews" })).toBe(reviews);
    expect(pdpMachine(reviews, { type: "product/change", productId: "b" }).tab).toBe("description");
  });
});
