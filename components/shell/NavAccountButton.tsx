import { forwardRef } from "react";
import { Icon, IconButton } from "@/components/ui";

/**
 * Dumb account trigger — IconButton + user glyph. Fires onAccount; the
 * owner decides (account page, menu). Account dropdown menu deferred —
 * no menu primitive exists, inventing one here balloons scope.
 */
export interface NavAccountButtonProps {
  onAccount: () => void;
  label?: string;
  /** Preview mode (account slice lands later): visibly disabled, never a dead click. */
  disabled?: boolean;
}

const NavAccountButton = forwardRef<HTMLButtonElement, NavAccountButtonProps>(
  function NavAccountButton({ onAccount, label = "Account", disabled = false }, ref) {
    return (
      <IconButton ref={ref} label={label} onClick={onAccount} disabled={disabled}>
        <Icon name="user" size={20} />
      </IconButton>
    );
  },
);

export default NavAccountButton;
