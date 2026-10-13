import { forwardRef } from "react";
import { Icon, IconButton } from "@/components/ui";

/**
 * Dumb wishlist trigger — IconButton + heart glyph. Fires onWishlist;
 * optional count badge mirrors the cart pattern (zero hides it).
 */
export interface NavWishlistButtonProps {
  count?: number;
  badgeCap?: number;
  onWishlist: () => void;
  label?: string;
}

const NavWishlistButton = forwardRef<HTMLButtonElement, NavWishlistButtonProps>(
  function NavWishlistButton({ count = 0, badgeCap = 9, onWishlist, label = "Wishlist" }, ref) {
    const shown = count > badgeCap ? `${badgeCap}+` : `${count}`;
    return (
      <span className="sf-navcart">
        <IconButton ref={ref} label={count > 0 ? `${label}, ${shown} items` : label} onClick={onWishlist}>
          <Icon name="heart" size={20} />
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

export default NavWishlistButton;
