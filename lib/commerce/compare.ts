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

/** Order-independent canonical query, capped at the limit. */
export function compareQuery(ids: readonly string[]): string {
  const unique = [...new Set(ids)].slice(0, COMPARE_LIMIT);
  return unique.length === 0 ? "" : `?ids=${unique.join(",")}`;
}

/** Parse `?ids=a,b`, dropping blanks and entries past the cap. */
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
