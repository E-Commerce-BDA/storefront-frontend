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
    // sf-081: a real side-by-side table, one column per capped id.
    expect(screen.getByRole("table", { name: "Product comparison" })).not.toBeNull();
    expect(screen.getAllByRole("columnheader")).toHaveLength(5); // attribute + 4 products
    expect(screen.getByTestId("tray")).not.toBeNull();
  });

  it("renders an empty state without ids", async () => {
    const tree = await ComparePage({ searchParams: Promise.resolve({}) });
    render(tree);
    expect(screen.queryByRole("table", { name: "Product comparison" })).toBeNull();
    expect(harness.ids).toBeUndefined();
  });

  it("shows the prototype's breadcrumb and eyebrow in both faces", async () => {
    const empty = await ComparePage({ searchParams: Promise.resolve({}) });
    const first = render(empty);
    const crumbs = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(crumbs.textContent).toContain("Home");
    expect(crumbs.textContent).toContain("Compare");
    expect(screen.getByText("SIDE BY SIDE")).not.toBeNull();
    first.unmount();

    const populated = await ComparePage({ searchParams: Promise.resolve({ ids: "a" }) });
    render(populated);
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).not.toBeNull();
    expect(screen.getByText("SIDE BY SIDE")).not.toBeNull();
  });
});
