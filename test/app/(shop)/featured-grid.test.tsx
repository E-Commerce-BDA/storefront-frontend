/**
 * FeaturedGrid — the home strip's RSC contract (plan §12 models/ islands tier;
 * the fetch shape is what §8 pins: "8 featured products", cached like every
 * catalog read). The card rendering is ProductGridIsland's already-tested face;
 * this test owns only *what the server hands it* and what an outage looks like.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const listProducts = vi.hoisted(() => vi.fn());
vi.mock("@/lib/catalog/client", () => ({
  catalogClient: () => ({ listProducts }),
}));
// Keep the seam honest without dragging the real mapper's rules in again.
const fromCatalogList = vi.hoisted(() => vi.fn((items: unknown[]) => items));
vi.mock("@/lib/commerce/fromCatalog", () => ({ fromCatalogList }));

import FeaturedGrid, { FEATURED_LIMIT } from "@/app/(shop)/_components/FeaturedGrid";
import ProductGridIsland from "@/app/(shop)/_components/ProductGridIsland";
import EmptyState from "@/components/ui/EmptyState";

beforeEach(() => {
  listProducts.mockReset();
  fromCatalogList.mockClear();
});

function findRendered(node: unknown): unknown[] {
  if (node == null) return [];
  if (Array.isArray(node)) return node.flatMap(findRendered);
  if (typeof node !== "object") return [];
  const el = node as { type?: unknown; props?: { children?: unknown } };
  return [el.type, ...findRendered(el.props?.children)];
}

describe("FeaturedGrid", () => {
  it("asks the catalog for exactly the house strip and hands the island mapped cards", async () => {
    listProducts.mockResolvedValue({ ok: true, data: { items: [{ id: "p1" }], nextCursor: "c" } });
    const tree = await FeaturedGrid();

    expect(listProducts).toHaveBeenCalledWith({ limit: FEATURED_LIMIT, sort: "created_desc" });
    expect(FEATURED_LIMIT).toBe(8);
    expect(fromCatalogList).toHaveBeenCalledWith([{ id: "p1" }]);
    expect(findRendered(tree).filter((t) => t === ProductGridIsland)).toHaveLength(1);
  });

  it("swaps to an unavailable state on a catalog outage — the hero still renders around it", async () => {
    listProducts.mockResolvedValue({ ok: false, kind: "unavailable", status: 503, code: "SERVICE_UNAVAILABLE", message: null });
    const tree = await FeaturedGrid();

    expect(findRendered(tree)).toContain(EmptyState);
    expect(findRendered(tree)).not.toContain(ProductGridIsland);
  });

  it("renders nothing for a brand-new empty catalog instead of an empty-state theatre", async () => {
    listProducts.mockResolvedValue({ ok: true, data: { items: [], nextCursor: null } });
    expect(await FeaturedGrid()).toBeNull();
  });
});
