import type { ReactNode } from "react";

/**
 * Dumb EmptyState — icon, title, one line of body, one action.
 *
 * The single face for "there is nothing here" across the listing (no matches),
 * the cart (A4.7) and the order history, so three routes do not invent three
 * different blanks. Copy is a prop, not a default: "No products matched" and
 * "Your bag is empty" are route decisions, and a block that guessed would be
 * wrong on two of the three.
 *
 * `action` is a slot, not an `onClick` — the caller passes a real `Button`, so
 * this block never learns about routing or the cart.
 */
export interface EmptyStateProps {
  /** Leading glyph, e.g. `<Icon name="shopping-bag" size={22} />`. */
  icon?: ReactNode;
  title: string;
  body?: string;
  /** Rendered under the body — a `Button`. */
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  body,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`sf-empty ${className}`}>
      {icon ? (
        // Decorative: the title carries the meaning, so the glyph is hidden.
        <div className="sf-empty__icon" aria-hidden="true">
          {icon}
        </div>
      ) : null}
      <p className="sf-empty__title">{title}</p>
      {body ? <p className="sf-empty__body">{body}</p> : null}
      {action ? <div className="sf-empty__action">{action}</div> : null}
    </div>
  );
}
