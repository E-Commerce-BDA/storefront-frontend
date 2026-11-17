// @vitest-environment jsdom
/** Contract tests for the dumb listing controls — they only paint props. */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import FilterRail from "@/components/commerce/FilterRail";
import SortSelect from "@/components/commerce/SortSelect";
import { buildCategoryTree } from "@/lib/catalog/facets";

afterEach(cleanup);

const categories = buildCategoryTree([
  { id: "a", name: "Apparel", slug: "apparel", parentId: null },
  { id: "s", name: "Shirts", slug: "shirts", parentId: "a" },
]);

describe("FilterRail", () => {
  it("paints real facet values and reports changes through callbacks", () => {
    const onTagToggle = vi.fn();
    const onCategoryChange = vi.fn();
    const onDiscountedChange = vi.fn();
    const { container } = render(
      <FilterRail
        categories={categories}
        brands={[{ slug: "northwind", name: "Northwind" }]}
        tags={["linen", "summer"]}
        priceBounds={{ min: 10, max: 100 }}
        selected={{ tags: ["linen"], discounted: false }}
        onTagToggle={onTagToggle}
        onCategoryChange={onCategoryChange}
        onDiscountedChange={onDiscountedChange}
      />,
    );

    expect(screen.getByText("linen")).not.toBeNull();
    expect(screen.getByText("Northwind")).not.toBeNull();
    const rail = container.querySelector(".sf-filter-rail") as HTMLElement;
    expect(rail.style.getPropertyValue("--facet-price-min")).toBe("10");

    fireEvent.click(screen.getByLabelText("summer"));
    expect(onTagToggle).toHaveBeenCalledWith("summer");

    fireEvent.click(screen.getByLabelText("Discounted only"));
    expect(onDiscountedChange).toHaveBeenCalledWith(true);

    const categorySelect = screen.getByLabelText("Category") as HTMLSelectElement;
    fireEvent.change(categorySelect, { target: { value: "shirts" } });
    expect(onCategoryChange).toHaveBeenCalledWith("shirts");
  });

  it("has no state of its own: a checked tag comes from props", () => {
    render(
      <FilterRail
        categories={[]}
        brands={[]}
        tags={["linen"]}
        priceBounds={{ min: null, max: null }}
        selected={{ tags: ["linen"] }}
      />,
    );
    expect((screen.getByLabelText("linen") as HTMLInputElement).checked).toBe(true);
  });
});

describe("SortSelect", () => {
  it("offers every catalog sort and reports the chosen value", () => {
    const onChange = vi.fn();
    render(<SortSelect value="price_asc" onChange={onChange} />);
    const select = screen.getByLabelText("Sort by") as HTMLSelectElement;
    expect(select.value).toBe("price_asc");
    expect(Array.from(select.options).map((option) => option.value).filter(Boolean)).toEqual([
      "created_desc",
      "price_asc",
      "price_desc",
      "name_asc",
      "rating_desc",
      "popularity_desc",
    ]);
    fireEvent.change(select, { target: { value: "rating_desc" } });
    expect(onChange).toHaveBeenCalledWith("rating_desc");
  });
});
