import type { CSSProperties } from "react";
import type { PdpDescriptionViewModel } from "@/lib/sections/viewModels";

/**
 * Dumb PDP description painter. The resolver supplies exactly one body: safe
 * CMS HTML or catalog plain text. `layout="prose"` keeps the 72ch measure;
 * `"wide"` stretches it to the section width.
 */
export interface PdpDescriptionSectionProps {
  model: PdpDescriptionViewModel;
  className?: string;
}

export default function PdpDescriptionSection({
  model,
  className = "",
}: PdpDescriptionSectionProps) {
  const style = {
    ...(model.bgColor !== undefined ? { "--section-bg": model.bgColor } : {}),
    ...(model.gutterPx !== undefined
      ? { "--pdp-description-gap": `${model.gutterPx}px` }
      : {}),
  } as CSSProperties;

  return (
    <section
      className={`sf-section sf-pdp-description ${className}`}
      style={style}
      aria-label={model.title ?? "Description"}
      data-layout={model.layout}
    >
      {model.title !== undefined ? (
        <div className="sf-section__head">
          <h2 className="sf-section__title">{model.title}</h2>
        </div>
      ) : null}
      {model.html !== undefined ? (
        <div
          className="sf-prose sf-pdp-description__body"
          dangerouslySetInnerHTML={{ __html: model.html }}
        />
      ) : model.text !== undefined ? (
        <p className="sf-pdp-description__text">{model.text}</p>
      ) : null}
    </section>
  );
}
