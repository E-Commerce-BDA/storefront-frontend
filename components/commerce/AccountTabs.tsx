import Pill from "@/components/ui/Pill";
import type { AccountTab } from "@/lib/account/machine";

/**
 * Dumb AccountTabs — the prototype's account tab strip. Controlled only: the
 * island owns the active face and pushes the matching URL; this painter reports
 * a tab press and never navigates on its own.
 */
const TABS: ReadonlyArray<{ id: AccountTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "orders", label: "Orders" },
  { id: "addresses", label: "Addresses" },
  { id: "wishlist", label: "Wishlist" },
  { id: "profile", label: "Profile" },
];

export interface AccountTabsProps {
  active: AccountTab;
  onSelect: (tab: AccountTab) => void;
  className?: string;
}

export default function AccountTabs({ active, onSelect, className = "" }: AccountTabsProps) {
  return (
    <nav className={`sf-account-tabs ${className}`} role="tablist" aria-label="Account sections">
      {TABS.map((tab) => (
        <Pill
          key={tab.id}
          role="tab"
          variant="chip"
          active={tab.id === active}
          aria-selected={tab.id === active}
          onClick={() => onSelect(tab.id)}
        >
          {tab.label}
        </Pill>
      ))}
    </nav>
  );
}
