import { forwardRef } from "react";
import { Icon, IconButton } from "@/components/ui";

/**
 * Dumb search trigger — IconButton + search glyph. Fires onOpen; the
 * owner (NavbarMount) opens SearchMount, which preloads the selected
 * overlay chunk on hover/focus of this trigger. props → JSX only.
 */
export interface NavSearchTriggerProps {
  onOpen: () => void;
  label?: string;
}

const NavSearchTrigger = forwardRef<HTMLButtonElement, NavSearchTriggerProps>(
  function NavSearchTrigger({ onOpen, label = "Search" }, ref) {
    return (
      <IconButton ref={ref} label={label} onClick={onOpen}>
        <Icon name="search" size={20} />
      </IconButton>
    );
  },
);

export default NavSearchTrigger;
