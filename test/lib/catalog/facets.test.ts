import { describe, expect, it } from "vitest";
import {
  buildCategoryBreadcrumb,
  buildCategoryTree,
  categoryPath,
  flattenCategoryTree,
} from "@/lib/catalog/facets";

const categories = [
  { id: "root", name: "Apparel", slug: "apparel", parentId: null },
  { id: "shirts", name: "Shirts", slug: "shirts", parentId: "root" },
  { id: "linen", name: "Linen", slug: "linen", parentId: "shirts" },
  { id: "orphan", name: "Orphan", slug: "orphan", parentId: "gone" },
];

describe("category facets", () => {
  it("builds a tree and treats an orphan parentId as a root", () => {
    const tree = buildCategoryTree(categories);
    expect(tree.map((node) => node.id)).toEqual(["root", "orphan"]);
    expect(tree[0].children[0].id).toBe("shirts");
    expect(tree[0].children[0].children[0].id).toBe("linen");
  });

  it("flattens into indented select options", () => {
    const options = flattenCategoryTree(buildCategoryTree(categories));
    expect(options.map((option) => option.slug)).toEqual([
      "apparel",
      "shirts",
      "linen",
      "orphan",
    ]);
    expect(options[2].depth).toBe(2);
  });

  it("walks the upward path and stops on an unknown id", () => {
    const tree = buildCategoryTree(categories);
    expect(categoryPath(tree, "linen").map((node) => node.slug)).toEqual([
      "apparel",
      "shirts",
      "linen",
    ]);
    expect(categoryPath(tree, "missing")).toEqual([]);
    expect(categoryPath(tree, undefined)).toEqual([]);
  });

  it("builds a breadcrumb whose links stay inside /products", () => {
    const tree = buildCategoryTree(categories);
    const crumbs = buildCategoryBreadcrumb(categoryPath(tree, "linen"));
    expect(crumbs).toEqual([
      { label: "Home", href: "/products" },
      { label: "Apparel", href: "/products?category=apparel" },
      { label: "Shirts", href: "/products?category=shirts" },
      { label: "Linen", href: "/products?category=linen" },
    ]);
    expect(buildCategoryBreadcrumb([])).toEqual([]);
  });
});
