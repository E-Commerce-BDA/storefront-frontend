import { forwardRef } from "react";
import { Icon, IconButton } from "@/components/ui";

/**
 * Dumb cart trigger — IconButton + bag glyph + count badge. Fires
 * onCart; MiniCartDrawer arrives with the cart slice. Count caps at
 * badgeCap ("9+"); zero hides the badge (absent data, absent UI).
 */
export interface NavCartButtonProps {
  count?: number;
  badgeCap?: number;
  onCart: () => void;
  label?: string;
  /** Preview mode (cart slice lands later): visibly disabled, never a dead click. */
  disabled?: boolean;
}

const NavCartButton = forwardRef<HTMLButtonElement, NavCartButtonProps>(
  function NavCartButton({ count = 0, badgeCap = 9, onCart, label = "Cart", disabled = false }, ref) {
    const shown = count > badgeCap ? `${badgeCap}+` : `${count}`;
    return (
      <span className="sf-navcart">
        <IconButton ref={ref} label={count > 0 ? `${label}, ${shown} items` : label} onClick={onCart} disabled={disabled}>
          <Icon name="shopping-bag" size={20} />
        </IconButton>
        {count > 0 && (
          <span className="sf-navcart__badge" aria-hidden="true">
            {shown}
          </span>
        )}
      </span>
    );
  },
);

export default NavCartButton;
