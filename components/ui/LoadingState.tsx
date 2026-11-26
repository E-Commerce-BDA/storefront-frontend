import type { CSSProperties } from "react";
import {
  resolveStateFace,
  resolveStateFaceCopy,
  type StateFaceOptions,
  type StateFaceSize,
} from "@/lib/ui/stateFaces";

/**
 * Dumb LoadingState — the one "work in progress" face.
 *
 * The spinner is decorative (`aria-hidden`); the status text carries the
 * meaning for assistive tech, so a screen reader hears one announcement rather
 * than an animated glyph. No timers here — the route owns when work ends.
 */
export interface LoadingStateProps {
  label?: string;
  size?: StateFaceSize;
  options?: StateFaceOptions;
  className?: string;
  style?: CSSProperties;
}

export default function LoadingState({
  label,
  size,
  options,
  className = "",
  style,
}: LoadingStateProps) {
  const face = resolveStateFace({ size, options });
  return (
    <div
      className={`sf-state sf-state--loading ${className}`}
      data-size={face.size}
      role="status"
      aria-busy="true"
      style={style}
    >
      <span className="sf-state__spinner" aria-hidden="true" />
      <p className="sf-state__title">{resolveStateFaceCopy("loading", label)}</p>
    </div>
  );
}
