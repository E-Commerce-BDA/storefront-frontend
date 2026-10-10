import { Icon } from "@/components/ui";

/**
 * Dumb spotlight trigger — blue accent circle opening search overlays.
 * Replaces the plain search icon wherever the overlay picker offers the
 * inspect experience; other variants keep their own triggers.
 * props → JSX. No state.
 */
export interface SpotlightButtonProps {
  onOpen: () => void;
  label?: string;
  className?: string;
}

export default function SpotlightButton({ onOpen, label = "Search", className = "" }: SpotlightButtonProps) {
  return (
    <button type="button" className={`sf-spotlight ${className}`} onClick={onOpen} aria-label={label}>
      <Icon name="search" size={20} />
    </button>
  );
}
