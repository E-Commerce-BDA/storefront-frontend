import type { CSSProperties } from "react";
import type { ResolvedCheckoutStep } from "@/lib/checkout/steps";

/**
 * Dumb checkout chrome — sf-058. `props → JSX`: resolved steps in, an ordered
 * list out. No state, no fetch, no navigation: the route owns which step is
 * active, and every step is a label rather than a clickable shortcut.
 */
export interface CheckoutStepsProps {
  steps: ResolvedCheckoutStep[];
  className?: string;
  style?: CSSProperties;
}

export default function CheckoutSteps({ steps, className = "", style }: CheckoutStepsProps) {
  return (
    <nav aria-label="Checkout progress" className={`sf-checkoutsteps ${className}`} style={style}>
      <ol className="sf-checkoutsteps__list">
        {steps.map((step, index) => (
          <li
            key={step.id}
            className="sf-checkoutsteps__step"
            data-state={step.state}
            aria-current={step.state === "active" ? "step" : undefined}
          >
            <span className="sf-checkoutsteps__index" aria-hidden="true">
              {index + 1}
            </span>
            <span className="sf-checkoutsteps__label">{step.label}</span>
          </li>
        ))}
      </ol>
    </nav>
  );
}
