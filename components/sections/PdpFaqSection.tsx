import type { CSSProperties } from "react";
import type { PdpFaqViewModel } from "@/lib/sections/viewModels";

/**
 * Dumb PDP FAQ painter. Accordion is `<details>` closed by default (zero
 * JS); list keeps every answer visible and drops the disclosure marker via
 * `data-layout`.
 */
export interface PdpFaqSectionProps {
  model: PdpFaqViewModel;
  className?: string;
}

export default function PdpFaqSection({
  model,
  className = "",
}: PdpFaqSectionProps) {
  const style = {
    ...(model.bgColor !== undefined ? { "--section-bg": model.bgColor } : {}),
    ...(model.gutterPx !== undefined
      ? { "--pdp-faq-gap": `${model.gutterPx}px` }
      : {}),
  } as CSSProperties;

  return (
    <section
      className={`sf-section sf-faq-wrap ${className}`}
      style={style}
      aria-label={model.title ?? "Questions"}
    >
      {model.title !== undefined ? (
        <div className="sf-section__head">
          <h2 className="sf-section__title">{model.title}</h2>
        </div>
      ) : null}
      <div className="sf-faq" data-layout={model.layout}>
        {model.items.map((item, index) =>
          model.layout === "list" ? (
            <div
              key={`${item.question}-${index}`}
              className="sf-faq__item"
            >
              <h3 className="sf-faq__q">{item.question}</h3>
              <p className="sf-faq__a">{item.answer}</p>
            </div>
          ) : (
            <details
              key={`${item.question}-${index}`}
              className="sf-faq__item"
            >
              <summary className="sf-faq__q">{item.question}</summary>
              <p className="sf-faq__a">{item.answer}</p>
            </details>
          ),
        )}
      </div>
    </section>
  );
}
