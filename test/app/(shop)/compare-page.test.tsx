// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import ComparePage from "@/app/(shop)/compare/page";

const harness = vi.hoisted(() => ({ ids: undefined as string[] | undefined }));

vi.mock("@/lib/catalog/client", () => ({
  catalogClient: () => ({
    listProducts: async (query: { ids?: string[] }) => {
      harness.ids = query.ids;
      return {
        ok: true,
        data: {
          items: (query.ids ?? []).map((id) => ({ id })),
          nextCursor: null,
        },
      };
    },
  }),
}));
vi.mock("@/lib/cms/theme", () => ({
  fetchThemeSettings: async () => ({ theme: null, stale: false, fallback: true }),
}));
vi.mock("@/components/commerce/ProductGridIsland", () => ({
  default: () => <div data-testid="grid" />,
}));
vi.mock("@/app/(shop)/compare/_components/CompareTray", () => ({
  default: () => <div data-testid="tray" />,
}));

afterEach(() => {
  cleanup();
  harness.ids = undefined;
});

describe("GET /compare", () => {
  it("caps at four ids and fetches only those", async () => {
    const tree = await ComparePage({
      searchParams: Promise.resolve({ ids: "a,b,a,c,d,e" }),
    });
    render(tree);
    expect(harness.ids).toEqual(["a", "b", "c", "d"]);
    expect(screen.getByTestId("grid")).not.toBeNull();
    expect(screen.getByTestId("tray")).not.toBeNull();
  });

  it("renders an empty state without ids", async () => {
    const tree = await ComparePage({ searchParams: Promise.resolve({}) });
    render(tree);
    expect(screen.queryByTestId("grid")).toBeNull();
    expect(harness.ids).toBeUndefined();
  });
});
