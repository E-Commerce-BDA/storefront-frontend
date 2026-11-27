import type { CSSProperties } from "react";
import { resolveTimeline } from "@/lib/order/timeline";

/**
 * Dumb Timeline — order status as a labelled ordered list. The stage is
 * resolved by lib from one status string; CSS reads `data-state` only.
 */
export interface TimelineProps {
  status: string;
  className?: string;
  style?: CSSProperties;
}

const LABELS: Record<string, string> = {
  placed: "Order placed",
  paid: "Payment confirmed",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
};

export default function Timeline({ status, className = "", style }: TimelineProps) {
  const timeline = resolveTimeline(status);
  return (
    <ol
      className={`sf-timeline ${className}`}
      data-stage={timeline.stage}
      aria-label="Order progress"
      style={style}
    >
      {timeline.steps.map((step) => (
        <li key={step.key} className="sf-timeline__step" data-state={step.state}>
          <span className="sf-timeline__dot" aria-hidden />
          <span>{LABELS[step.key]}</span>
          {step.state === "active" ? (
            <span className="sf-timeline__current" aria-current="step">
              Current
            </span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
