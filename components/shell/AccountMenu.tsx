import type { CSSProperties } from "react";
import Link from "next/link";
import type { AccountMenuModel } from "@/lib/shell/accountMenu";

/**
 * Dumb shell dropdown — sf-072. `props → JSX`: the model and open-state come
 * from NavbarMount; this file holds no state, fetch or store. The sign-out is
 * a native POST form because /api/auth/logout is POST-only and its 303 lands
 * the shopper on the public shell. An anchor here would be a GET side effect.
 */
export interface AccountMenuProps {
  model: AccountMenuModel;
  open: boolean;
  onClose: () => void;
  className?: string;
  style?: CSSProperties;
}

export default function AccountMenu({
  model,
  open,
  onClose,
  className = "",
  style,
}: AccountMenuProps) {
  return (
    <div
      className={`sf-accountmenu ${className}`}
      data-open={open}
      hidden={!open}
      style={style}
    >
      <nav aria-label="Account menu">
        <ul className="sf-accountmenu__list">
          {model.links.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="sf-accountmenu__link" onClick={onClose}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <form action={model.signOut.action} method="post" className="sf-accountmenu__form">
        <input type="hidden" name="next" value={model.signOut.next} />
        <button type="submit" className="sf-accountmenu__signout">
          {model.signOut.label}
        </button>
      </form>
    </div>
  );
}
