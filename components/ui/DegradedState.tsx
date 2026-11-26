import type { CSSProperties, ReactNode } from "react";
import {
  resolveStateFace,
  resolveStateFaceCopy,
  type StateFaceOptions,
  type StateFaceSize,
} from "@/lib/ui/stateFaces";

/**
 * Dumb DegradedState — the one "partial content" face.
 *
 * Different from ErrorState: the page is usable, one block is not. It defaults
 * to the compact size through the resolver (not a component-level default), so
 * a CMS outage reads as a short note rather than a page-swallowing heading.
 */
export interface DegradedStateProps {
  title?: string;
  body?: string;
  action?: ReactNode;
  size?: StateFaceSize;
  options?: StateFaceOptions;
  className?: string;
  style?: CSSProperties;
}

export default function DegradedState({
  title,
  body,
  action,
  size,
  options,
  className = "",
  style,
}: DegradedStateProps) {
  const face = resolveStateFace({ size, options }, "compact");
  return (
    <div
      className={`sf-state sf-state--degraded ${className}`}
      data-size={face.size}
      role="status"
      style={style}
    >
      <p className="sf-state__title">{resolveStateFaceCopy("degraded", title)}</p>
      {body ? <p className="sf-state__body">{body}</p> : null}
      {action ? <div className="sf-state__action">{action}</div> : null}
    </div>
  );
}
