/**
 * Compare-tray ids — sf-055 (A3.7)
 *
 * Pure id rules shared by the provider and the /compare route: dedupe by
 * product id, cap at four, and a deterministic order for the shareable URL.
 * A full tray refuses new ids rather than dropping the oldest — silently
 * replacing a shopper's choice is worse than telling them the tray is full.
 */

export const COMPARE_LIMIT = 4;

export function addCompareId(
  ids: readonly string[],
  productId: string,
): { ids: string[]; added: boolean; full: boolean } {
  if (ids.includes(productId)) {
    return { ids: [...ids], added: false, full: false };
  }
  if (ids.length >= COMPARE_LIMIT) {
    return { ids: [...ids], added: false, full: true };
  }
  return { ids: [...ids, productId], added: true, full: false };
}

export function removeCompareId(ids: readonly string[], productId: string): string[] {
  return ids.filter((id) => id !== productId);
}

export function compareQuery(ids: readonly string[]): string {
  const unique = [...new Set(ids)].slice(0, COMPARE_LIMIT);
  return unique.length === 0 ? "" : `?ids=${unique.join(",")}`;
}

export function parseCompareQuery(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  for (const part of raw.split(",")) {
    const id = part.trim();
    if (id === "") continue;
    seen.add(id);
    if (seen.size >= COMPARE_LIMIT) break;
  }
  return [...seen];
}

/** A row of the comparison table — values are already display strings. */
export interface CompareRow {
  label: string;
  values: readonly string[];
}

export interface CompareCellSource {
  price: number;
  compareAt?: number;
  category: string;
  brandName?: string;
  rating?: number;
  stock?: string;
}

const money = (value: number) => `$${value}`;

/** Pure mapper from the shared card data to display rows — one vocabulary. */
export function compareRows(items: readonly CompareCellSource[]): CompareRow[] {
  return [
    { label: "Price", values: items.map((item) => money(item.price)) },
    { label: "Was", values: items.map((item) => (item.compareAt ? money(item.compareAt) : "—")) },
    { label: "Category", values: items.map((item) => item.category || "—") },
    { label: "Brand", values: items.map((item) => item.brandName ?? "—") },
    {
      label: "Rating",
      values: items.map((item) => (item.rating !== undefined ? `${item.rating} / 5` : "—")),
    },
    {
      label: "Availability",
      values: items.map((item) => (item.stock === "out" ? "Out of stock" : "Available")),
    },
  ];
}

/**
 * "Differences only" keeps a row when at least one column disagrees. With a
 * single product every row is trivially equal, so the full table stays.
 */
export function visibleCompareRows(rows: readonly CompareRow[], differencesOnly: boolean): CompareRow[] {
  if (!differencesOnly || rows.length === 0) return [...rows];
  const first = rows[0]?.values.length ?? 0;
  if (first < 2) return [...rows];
  return rows.filter((row) => row.values.some((value) => value !== row.values[0]));
}

export type CompareViewFace = "all" | "differences";

export interface CompareViewModelachineState {
  face: CompareViewFace;
}

export type CompareViewMachineEvent = { type: "face/set"; face: CompareViewFace };

export function initialCompareViewMachine(): CompareViewModelachineState {
  return { face: "all" };
}

export function compareViewMachine(
  state: CompareViewModelachineState,
  event: CompareViewMachineEvent,
): CompareViewModelachineState {
  return state.face === event.face ? state : { face: event.face };
}
