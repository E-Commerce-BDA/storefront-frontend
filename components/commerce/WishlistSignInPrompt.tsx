import type { CSSProperties } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";
import type { WishlistGuestPrompt } from "@/lib/wishlist/prompt";

/**
 * Dumb guest prompt — sf-056. `props → JSX`: the model is resolved upstream;
 * Escape/overlay dismissal is the parent's job (controlled-only, as with Dialog).
 * The sign-in link carries the pending product via the `sf_pw` cookie, so no
 * product id needs to reach this component or the URL.
 */
export interface WishlistSignInPromptProps {
  model: WishlistGuestPrompt;
  onDismiss: () => void;
  className?: string;
  style?: CSSProperties;
}

export default function WishlistSignInPrompt({
  model,
  onDismiss,
  className = "",
  style,
}: WishlistSignInPromptProps) {
  return (
    <div className={`sf-wishlist-prompt ${className}`} role="presentation" style={style}>
      <div className="sf-wishlist-prompt__backdrop" onClick={onDismiss} />
      <div className="sf-wishlist-prompt__panel" role="dialog" aria-modal="true" aria-labelledby="sf-wishlist-prompt-title">
        <h2 id="sf-wishlist-prompt-title" className="sf-wishlist-prompt__title">
          {model.title}
        </h2>
        <p className="sf-wishlist-prompt__body">{model.body}</p>
        {model.productName ? (
          <p className="sf-wishlist-prompt__item" data-product-name={model.productName}>
            {model.productName}
          </p>
        ) : null}
        <div className="sf-wishlist-prompt__actions">
          <Link href={model.signInHref} className="sf-wishlist-prompt__signin" onClick={onDismiss}>
            {model.signInLabel}
          </Link>
          <Button variant="ghost-ink" size="sm" onClick={onDismiss}>
            {model.dismissLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
