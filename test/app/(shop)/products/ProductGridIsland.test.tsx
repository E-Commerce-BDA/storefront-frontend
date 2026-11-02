// @vitest-environment jsdom
/**
 * ProductGridIsland — the listing's client seam (plan §12 islands tier).
 *
 * The grid and the card already have their own contract tests, so this test does
 * not re-drive a card button; it mocks `ProductGrid` and asserts the three
 * things *only the island* decides:
 *
 * 1. a quick-add POSTs **once**, with the product **id** (not the url);
 * 2. the pending/added sets handed to the grid are keyed by **url** — the
 *    translation the grid's `url ?? id` marking expects from a catalog page;
 * 3. opening a card pushes the card's `url` through the router.
 *
 * It also proves the single add path: the port calls `cart.refresh()` and nothing
 * else — no second optimistic `cart.add()` that would double-POST.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, waitFor } from "@testing-library/react";
import type { ProductCardData } from "@/lib/commerce/productCard";
import ProductGridIsland from "@/components/commerce/ProductGridIsland";

const harness = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(async () => {}),
  add: vi.fn(),
  lastProps: { current: null as unknown },
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: harness.push }) }));
vi.mock("@/app/_components/WishlistProvider", () => ({
  useWishlist: () => ({ ids: [], pendingIds: [], has: () => false, toggle: vi.fn(), remove: vi.fn() }),
}));
vi.mock("@/app/_components/CartProvider", () => ({
  useCart: () => ({ refresh: harness.refresh, add: harness.add }),
}));
vi.mock("@/components/commerce/ProductGrid", () => ({
  default: (props: { items: unknown }) => {
    harness.lastProps.current = props;
    return <div data-testid="grid" />;
  },
}));

const MUTATION = {
  item: { id: "i1", productId: "p1", qty: 1, unitPrice: 12.5, productName: "Mug" },
  totals: { subtotal: 12.5, itemCount: 1, lineCount: 1 },
};

const card = (over: Partial<ProductCardData> = {}): ProductCardData => ({
  id: "p1",
  name: "Ocean Linen Shirt",
  price: 40,
  image: "a.jpg",
  category: "Shirts",
  url: "/products/ocean-linen-shirt",
  ...over,
});

function stubFetch(status: number, body: unknown) {
  const fetchFn = vi.fn(async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    }),
  );
  vi.stubGlobal("fetch", fetchFn);
  return fetchFn;
}

function gridProps() {
  return harness.lastProps.current as {
    pendingIds: string[];
    addedIds: string[];
    onOpen: (p: ProductCardData) => void;
    onQuickAdd: (p: ProductCardData) => void;
  };
}

beforeEach(() => {
  harness.push.mockClear();
  harness.refresh.mockClear();
  harness.add.mockClear();
  harness.lastProps.current = null;
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ProductGridIsland", () => {
  it("renders the grid with the mapped items the RSC passed down", () => {
    render(<ProductGridIsland items={[card()]} />);
    const items = (harness.lastProps.current as { items: ProductCardData[] }).items;
    expect(items).toHaveLength(1);
    expect(items[0]!.name).toBe("Ocean Linen Shirt");
  });

  it("quick-adds with the product id, marks the cell by url, and refreshes once", async () => {
    const fetchFn = stubFetch(201, MUTATION);
    render(<ProductGridIsland items={[card()]} />);

    gridProps().onQuickAdd(card());

    // The id (not the url) is what goes over the wire.
    const [, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({ productId: "p1", qty: 1 });

    // The paint set is url-keyed, which is what ProductGrid reads for a catalog row.
    await waitFor(() => {
      expect(gridProps().addedIds).toEqual(["/products/ocean-linen-shirt"]);
    });
    expect(gridProps().pendingIds).toEqual([]);

    // One add path: the port reconciles through refresh(); the optimistic store
    // add is never called here (it would double-POST).
    expect(harness.refresh).toHaveBeenCalledTimes(1);
    expect(harness.add).not.toHaveBeenCalled();
  });

  it("marks the cell pending while the add is in flight", () => {
    // A fetch that never resolves keeps the pending state observable. The tap is
    // not a DOM event, so `act` is what flushes the store's setState into a
    // re-render the mocked grid can see.
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(() => {})));
    render(<ProductGridIsland items={[card()]} />);

    act(() => {
      gridProps().onQuickAdd(card());
    });
    expect(gridProps().pendingIds).toEqual(["/products/ocean-linen-shirt"]);
    expect(gridProps().addedIds).toEqual([]);
  });

  it("does not mark added when the BFF refuses (422 out of stock)", async () => {
    stubFetch(422, { error: { code: "CART_PRODUCT_UNAVAILABLE", message: "out of stock" } });
    render(<ProductGridIsland items={[card()]} />);

    gridProps().onQuickAdd(card());
    await waitFor(() => expect(gridProps().pendingIds).toEqual([]));
    expect(gridProps().addedIds).toEqual([]);
    expect(harness.refresh).not.toHaveBeenCalled();
  });

  it("opens a card by pushing its url", () => {
    render(<ProductGridIsland items={[card()]} />);
    gridProps().onOpen(card());
    expect(harness.push).toHaveBeenCalledWith("/products/ocean-linen-shirt");
  });
});
