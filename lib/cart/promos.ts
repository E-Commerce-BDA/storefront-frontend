/**
 * Quick promo vocabulary — sf-093. Pure.
 *
 * These are the three codes the prototype offers as one-tap suggestions. They
 * are labels only: applying one still goes through the same validation BFF as a
 * typed code, so a stale admin-side code fails honestly instead of being
 * trusted because it appears here.
 */
export const QUICK_PROMOS: readonly string[] = ["OCEAN10", "WELCOME15", "FREESHIP"];

export function resolveQuickPromos(applied: string | undefined): Array<{ code: string; active: boolean }> {
  const active = applied?.trim().toUpperCase();
  return QUICK_PROMOS.map((code) => ({ code, active: code === active }));
}
