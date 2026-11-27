import type { ReactNode } from "react";
import Pill from "@/components/ui/Pill";
import type { PdpTabId } from "@/lib/pdp/tabs";

/**
 * Dumb PdpTabs — the prototype's pill strip over already-resolved panels.
 * `active` and `onChange` are owned by the island; every panel stays in the DOM
 * and is hidden with the native `hidden` attribute, so a search engine and a
 * screen reader both see the same content the tab strip reveals.
 */
export interface PdpTabView {
  id: PdpTabId;
  label: string;
  content: ReactNode;
}

export interface PdpTabsProps {
  tabs: readonly PdpTabView[];
  active: PdpTabId;
  onChange: (id: PdpTabId) => void;
  className?: string;
}

export default function PdpTabs({ tabs, active, onChange, className = "" }: PdpTabsProps) {
  if (tabs.length === 0) return null;

  return (
    <section className={`sf-pdp-tabs ${className}`} aria-label="Product details">
      <div className="sf-pdp-tabs__list" role="tablist" aria-label="Product information">
        {tabs.map((tab) => (
          <Pill
            key={tab.id}
            role="tab"
            variant="chip"
            active={tab.id === active}
            aria-selected={tab.id === active}
            aria-controls={`sf-pdp-panel-${tab.id}`}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </Pill>
        ))}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          id={`sf-pdp-panel-${tab.id}`}
          className="sf-pdp-tabs__panel"
          role="tabpanel"
          hidden={tab.id !== active}
        >
          {tab.content}
        </div>
      ))}
    </section>
  );
}
