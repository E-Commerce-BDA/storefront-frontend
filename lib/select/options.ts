/**
 * Options port — form-domain option lists (select dropdowns first,
 * radio/checkbox groups later).
 *
 * Hooks depend on this interface, never on URLs or fetch. The demo
 * source (demoOptions.ts) serves today; the CMS/service source swaps in
 * at the call site (one line) when it lands. Throwaway-by-replacement,
 * never rewrite.
 *
 * Pure types + port. No React, no fetch.
 */
import type { SelectOption } from "@/components/ui/Select";

export type { SelectOption };

export interface OptionsSource {
  /** Full option list. Aborts on `signal` — stale lists never land. */
  list(signal: AbortSignal): Promise<SelectOption[]>;
}
