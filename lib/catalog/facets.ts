/**
 * Listing facet helpers — sf-054
 *
 * Pure tree rules for the category filter rail and its breadcrumb. Catalog
 * returns a flat list with `parentId`; the tree and the upward path are decided
 * here so the rail is a dumb painter and the route never re-implements the
 * parent walk. An orphan `parentId` is treated as a root — inventing a parent
 * would make the breadcrumb point at a category that does not exist.
 */

import type { CatalogCategory } from "@/lib/catalog/schemas";
import { buildListingQuery } from "@/lib/catalog/listing";
import type { BreadcrumbItem } from "@/lib/shell/pageHeader";

export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  children: CategoryNode[];
}

type CategoryRef = Pick<
  CatalogCategory,
  "id" | "name" | "slug" | "parentId"
>;

export function buildCategoryTree(
  categories: readonly CategoryRef[] | null | undefined,
): CategoryNode[] {
  const nodes = new Map<string, CategoryNode>();
  for (const category of categories ?? []) {
    nodes.set(category.id, {
      id: category.id,
      name: category.name,
      slug: category.slug,
      children: [],
    });
  }

  const roots: CategoryNode[] = [];
  for (const category of categories ?? []) {
    const node = nodes.get(category.id);
    if (node === undefined) continue;
    const parent =
      category.parentId !== null && category.parentId !== undefined
        ? nodes.get(category.parentId)
        : undefined;
    if (parent !== undefined && parent.id !== node.id) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

/**
 * Root-to-node path for a category id. `[]` when the id is unknown; a cycle in
 * malformed catalog data stops after `nodes.size` hops rather than hanging.
 */
export function categoryPath(
  roots: readonly CategoryNode[],
  categoryId: string | undefined,
): CategoryNode[] {
  if (categoryId === undefined) return [];
  const byId = new Map<string, CategoryNode>();
  const parentOf = new Map<string, string>();
  const walk = (nodes: readonly CategoryNode[], parent?: CategoryNode) => {
    for (const node of nodes) {
      byId.set(node.id, node);
      if (parent !== undefined) parentOf.set(node.id, parent.id);
      walk(node.children, node);
    }
  };
  walk(roots);

  const path: CategoryNode[] = [];
  let cursor: string | undefined = categoryId;
  while (cursor !== undefined && path.length <= byId.size) {
    const node = byId.get(cursor);
    if (node === undefined) return [];
    path.unshift(node);
    cursor = parentOf.get(cursor);
  }
  return path;
}

export interface CategoryOption {
  id: string;
  slug: string;
  label: string;
  depth: number;
}

export function flattenCategoryTree(
  roots: readonly CategoryNode[],
): CategoryOption[] {
  const out: CategoryOption[] = [];
  const walk = (nodes: readonly CategoryNode[], depth: number) => {
    for (const node of nodes) {
      out.push({
        id: node.id,
        slug: node.slug,
        label: `${"　".repeat(depth)}${node.name}`,
        depth,
      });
      walk(node.children, depth + 1);
    }
  };
  walk(roots, 0);
  return out;
}

export function buildCategoryBreadcrumb(
  path: readonly CategoryNode[],
): BreadcrumbItem[] {
  if (path.length === 0) return [];
  return [
    { label: "Home", href: "/products" },
    ...path.map((node) => ({
      label: node.name,
      href: `/products${buildListingQuery({ categorySlug: node.slug })}`,
    })),
  ];
}
