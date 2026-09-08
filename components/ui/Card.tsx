import { forwardRef } from "react";

/** Dumb Card — white surface, 1px border, radius 12. */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

const Card = forwardRef<HTMLDivElement, CardProps>(function Card({ title, action, children, className = "", style = {}, ...rest }, ref) {
  return (
    <div
      ref={ref}
      className={`border border-[var(--border)] bg-white p-4 ${className}`}
      style={{ borderRadius: "var(--radius-card)", ...style }}
      {...rest}
    >
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title && <h3 className="text-sm font-semibold text-[var(--color-ink)]">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
});

export default Card;
