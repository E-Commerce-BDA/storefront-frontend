"use client";

/**
 * PDP section island — sf-092.
 *
 * The CMS page stays the source of truth. This island only picks which of its
 * four tabbable section groups is visible; the panels themselves are rendered
 * by the shared `SectionRenderer`, so a description section paints identically
 * here and on a page that has no tabs. The index is a pure machine event.
 */
import { useReducer } from "react";
import SectionRenderer from "@/components/sections/SectionRenderer";
import PdpTabs, { type PdpTabView } from "@/components/commerce/PdpTabs";
import {
  activePdpTab,
  groupPdpSections,
  initialPdpTabsMachine,
  pdpTabsMachine,
} from "@/lib/pdp/tabs";
import type { GridColumns } from "@/lib/commerce/fromCatalog";
import type { ResolvedThemeProductCard } from "@/lib/cms/themeSettings";
import type { SectionViewModel } from "@/lib/sections/viewModels";

export interface PdpSectionsProps {
  models: SectionViewModel[];
  columns?: Partial<GridColumns>;
  themeFallback?: ResolvedThemeProductCard;
  tones?: React.ComponentProps<typeof SectionRenderer>["tones"];
}

export default function PdpSections({ models, columns, themeFallback, tones }: PdpSectionsProps) {
  const [state, dispatch] = useReducer(pdpTabsMachine, undefined, initialPdpTabsMachine);
  const { tabs, rest } = groupPdpSections(models);

  const render = (group: SectionViewModel[]) => (
    <SectionRenderer models={group} columns={columns} themeFallback={themeFallback} tones={tones} />
  );

  const views: PdpTabView[] = tabs.map((tab) => ({
    id: tab.id,
    label: tab.label,
    content: render(tab.models),
  }));

  return (
    <>
      {views.length > 0 ? (
        <PdpTabs
          tabs={views}
          active={activePdpTab(state, tabs)}
          onChange={(id) => dispatch({ type: "tab/set", id })}
        />
      ) : null}
      {rest.length > 0 ? render(rest) : null}
    </>
  );
}
