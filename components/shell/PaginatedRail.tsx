"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import IconButton from "@/components/ui/IconButton";
import { Icon } from "@/components/ui/icons";
import { railStep, type RailMotion } from "@/lib/sections/railModel";

/**
 * Dumb PaginatedRail — the prototype's draggable, looping strip. The owner
 * stores the page index; this component only turns pointer deltas and dot
 * presses into `onIndexChange` calls. The pointer origin is a ref because it is
 * bookkeeping, never rendered state. Motion is a resolved CSS var.
 */
export interface PaginatedRailProps {
  items: readonly ReactNode[];
  index: number;
  pageCount: number;
  onIndexChange: (index: number) => void;
  loop?: boolean;
  motion?: RailMotion;
  label?: string;
  className?: string;
  style?: CSSProperties;
}

/** Minimum horizontal travel before a drag becomes a page change. */
const DRAG_THRESHOLD_PX = 48;

export default function PaginatedRail({
  items,
  index,
  pageCount,
  onIndexChange,
  loop = true,
  motion = "on",
  label = "Product rail",
  className = "",
  style,
}: PaginatedRailProps) {
  const startX = useRef<number | null>(null);
  const step = (delta: number) => onIndexChange(railStep(index, pageCount, delta, loop));

  return (
    <section
      className={`sf-rail ${className}`}
      aria-label={label}
      data-loop={loop}
      data-motion={motion}
      style={style}
    >
      <div
        className="sf-rail__track"
        onPointerDown={(event) => {
          startX.current = event.clientX;
        }}
        onPointerUp={(event) => {
          if (startX.current === null) return;
          const delta = event.clientX - startX.current;
          startX.current = null;
          if (Math.abs(delta) >= DRAG_THRESHOLD_PX) step(delta < 0 ? 1 : -1);
        }}
        onPointerCancel={() => {
          startX.current = null;
        }}
      >
        {items.map((item, position) => (
          <div className="sf-rail__cell" key={position} aria-hidden={position !== index}>
            {item}
          </div>
        ))}
      </div>
      {pageCount > 1 ? (
        <div className="sf-rail__controls">
          <IconButton label="Previous page" size={32} onClick={() => step(-1)}>
            <Icon name="chevron-left" size={16} />
          </IconButton>
          <div className="sf-rail__dots" role="tablist" aria-label={`${label} pages`}>
            {Array.from({ length: pageCount }, (_, dot) => (
              <button
                key={dot}
                type="button"
                role="tab"
                className="sf-rail__dot"
                aria-selected={dot === index}
                aria-label={`Page ${dot + 1} of ${pageCount}`}
                onClick={() => onIndexChange(dot)}
              />
            ))}
          </div>
          <IconButton label="Next page" size={32} onClick={() => step(1)}>
            <Icon name="chevron-right" size={16} />
          </IconButton>
        </div>
      ) : null}
    </section>
  );
}
