import type { CSSProperties } from "react";
import type { PdpDetailsViewModel } from "@/lib/sections/viewModels";

/**
 * Dumb PDP details painter. Rows arrive in admin order (or catalog order);
 * the column count is a CSS var so the grid ladder lives in one stylesheet.
 */
export interface PdpDetailsSectionProps {
  model: PdpDetailsViewModel;
  className?: string;
}

export default function PdpDetailsSection({
  model,
  className = "",
}: PdpDetailsSectionProps) {
  const style = {
    ...(model.bgColor !== undefined ? { "--section-bg": model.bgColor } : {}),
    ...(model.gutterPx !== undefined
      ? { "--pdp-details-gap": `${model.gutterPx}px` }
      : {}),
    "--details-cols": String(model.columns),
  } as CSSProperties;

  return (
    <section
      className={`sf-section sf-pdp-details ${className}`}
      style={style}
      aria-label={model.title ?? "Details"}
      data-columns={model.columns}
    >
      {model.title !== undefined ? (
        <div className="sf-section__head">
          <h2 className="sf-section__title">{model.title}</h2>
        </div>
      ) : null}
      <dl className="sf-pdp-details__grid">
        {model.rows.map((row, index) => (
          <div
            key={`${row.label}-${index}`}
            className="sf-pdp-details__row"
          >
            <dt className="sf-pdp-details__term">{row.label}</dt>
            <dd className="sf-pdp-details__value">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
