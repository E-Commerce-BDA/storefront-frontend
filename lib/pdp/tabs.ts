/**
 * PDP tab resolver — sf-092. Pure.
 *
 * The CMS page is a flat ordered list of sections; the shopper-facing PDP groups
 * four of them into the prototype's tab strip. Grouping is a *view* decision,
 * so it lives here: the route stays a fetch + one renderer call, and the island
 * never guesses which section belongs where.
 *
 * Sections that are not tabbable (trust, story, related products) stay in the
 * page flow instead of being hidden inside a tab — a related-products rail
 * behind a "Questions" tab would be a content bug, not parity.
 */
import type { SectionViewModel } from "@/lib/sections/viewModels";

export type PdpTabId = "description" | "details" | "reviews" | "faq";

export interface PdpTabModel {
  id: PdpTabId;
  label: string;
  models: SectionViewModel[];
}

export interface PdpTabGroups {
  tabs: PdpTabModel[];
  rest: SectionViewModel[];
}

const TAB_FOR_TYPE: Record<string, PdpTabId> = {
  pdp_description: "description",
  pdp_details: "details",
  pdp_reviews: "reviews",
  testimonial: "reviews",
  pdp_faq: "faq",
};

const LABELS: Record<PdpTabId, string> = {
  description: "Description",
  details: "Materials & Care",
  reviews: "Reviews",
  faq: "Questions",
};

const ORDER: readonly PdpTabId[] = ["description", "details", "reviews", "faq"];

export function groupPdpSections(models: readonly SectionViewModel[]): PdpTabGroups {
  const byTab = new Map<PdpTabId, SectionViewModel[]>();
  const rest: SectionViewModel[] = [];

  for (const model of models) {
    const tab = TAB_FOR_TYPE[model.type];
    if (tab === undefined) {
      rest.push(model);
      continue;
    }
    const bucket = byTab.get(tab) ?? [];
    bucket.push(model);
    byTab.set(tab, bucket);
  }

  const tabs: PdpTabModel[] = [];
  for (const id of ORDER) {
    const group = byTab.get(id);
    if (group !== undefined && group.length > 0) {
      tabs.push({ id, label: LABELS[id], models: group });
    }
  }
  return { tabs, rest };
}

export interface PdpTabsMachineState {
  active: PdpTabId;
}

export type PdpTabsMachineEvent = { type: "tab/set"; id: PdpTabId };

export function initialPdpTabsMachine(): PdpTabsMachineState {
  return { active: "description" };
}

export function pdpTabsMachine(
  state: PdpTabsMachineState,
  event: PdpTabsMachineEvent,
): PdpTabsMachineState {
  return state.active === event.id ? state : { active: event.id };
}

/** A page with no description section still needs a visible first tab. */
export function activePdpTab(state: PdpTabsMachineState, tabs: readonly PdpTabModel[]): PdpTabId {
  return tabs.some((tab) => tab.id === state.active)
    ? state.active
    : (tabs[0]?.id ?? "description");
}
