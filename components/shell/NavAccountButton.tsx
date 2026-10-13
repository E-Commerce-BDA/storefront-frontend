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
}

const NavAccountButton = forwardRef<HTMLButtonElement, NavAccountButtonProps>(
  function NavAccountButton({ onAccount, label = "Account" }, ref) {
    return (
      <IconButton ref={ref} label={label} onClick={onAccount}>
        <Icon name="user" size={20} />
      </IconButton>
    );
  },
);

export default NavAccountButton;
