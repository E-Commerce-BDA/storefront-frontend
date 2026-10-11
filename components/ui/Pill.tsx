import { forwardRef } from "react";

/**
 * Dumb Pill — the one interactive pill shared by overlay filters,
 * trending chips and quick-add actions. Renders a native <button> so
 * existing `.sf-* button` selectors and role queries keep matching;
 * state reaches CSS only through data-* attrs. Theming rides --pill-*
 * vars (parent inlines, tokens fall back) — the Pill knows no knobs.
 */
export type PillVariant = "filter" | "chip" | "action";

export interface PillProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** filter = dept select, chip = trending term, action = quick-add. */
  variant?: PillVariant;
  /** Selected state (filter/chip) → data-active. */
  active?: boolean;
  /** Free state hook (e.g. quick-add "added") → data-state. */
  state?: string;
  children: React.ReactNode;
}

const Pill = forwardRef<HTMLButtonElement, PillProps>(function Pill(
  { variant = "filter", active = false, state, className = "", type = "button", children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      data-pill={variant}
      data-active={active}
      data-state={state}
      className={`sf-pill ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
});

export default Pill;
