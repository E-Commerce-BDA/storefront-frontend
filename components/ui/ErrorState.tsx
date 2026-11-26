import type { CSSProperties, ReactNode } from "react";
import {
  resolveStateFace,
  type StateFaceOptions,
  type StateFaceSize,
} from "@/lib/ui/stateFaces";

/**
 * Dumb ErrorState — the one "this failed" face.
 *
 * Copy is a prop, not a guess: a cart, a checkout and a CMS document each fail
 * for a different reason, and none of them is entitled to invent the other's
 * message. The action is a slot — the caller passes a real `Button` with
 * `variant="primary"` so this block never learns about routing or retry APIs.
 */
export interface ErrorStateProps {
  title: string;
  body?: string;
  action?: ReactNode;
  size?: StateFaceSize;
  options?: StateFaceOptions;
  className?: string;
  style?: CSSProperties;
}

export default function ErrorState({
  title,
  body,
  action,
  size,
  options,
  className = "",
  style,
}: ErrorStateProps) {
  const face = resolveStateFace({ size, options });
  return (
    <div className={`sf-state sf-state--error ${className}`} data-size={face.size} role="alert" style={style}>
      <p className="sf-state__title">{title}</p>
      {body ? <p className="sf-state__body">{body}</p> : null}
      {action ? <div className="sf-state__action">{action}</div> : null}
    </div>
  );
}
