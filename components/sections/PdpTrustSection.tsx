import type { CSSProperties } from "react";
import { Icon } from "@/components/ui/icons";
import type { PdpTrustViewModel } from "@/lib/sections/viewModels";

/**
 * Dumb PDP trust painter. Icons are typed by the contracts vocabulary, so
 * the Icon accepts them without a cast. `layout="rows"` stacks; `"grid"`
 * flows the same items across columns.
 */
export interface PdpTrustSectionProps {
  model: PdpTrustViewModel;
  className?: string;
}

export default function PdpTrustSection({
  model,
  className = "",
}: PdpTrustSectionProps) {
  const style = {
    ...(model.bgColor !== undefined ? { "--section-bg": model.bgColor } : {}),
    ...(model.gutterPx !== undefined
      ? { "--pdp-trust-gap": `${model.gutterPx}px` }
      : {}),
  } as CSSProperties;

  return (
    <section
      className={`sf-section sf-pdp-trust ${className}`}
      style={style}
      aria-label={model.title ?? "Trust badges"}
      data-layout={model.layout}
      data-icons={model.showIcons}
    >
      {model.title !== undefined ? (
        <div className="sf-section__head">
          <h2 className="sf-section__title">{model.title}</h2>
        </div>
      ) : null}
      <ul className="sf-pdp-trust__list">
        {model.items.map((item) => (
          <li key={item.id} className="sf-pdp-trust__item">
            {model.showIcons ? (
              <Icon name={item.icon} size={18} className="sf-pdp-trust__icon" />
            ) : null}
            <span className="sf-pdp-trust__copy">
              <span className="sf-pdp-trust__title">{item.title}</span>
              <span className="sf-pdp-trust__desc">{item.description}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
