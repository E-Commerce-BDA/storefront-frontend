import type { CSSProperties } from "react";
import Button from "@/components/ui/Button";
import type { PdpStoryViewModel } from "@/lib/sections/viewModels";

/**
 * Dumb PDP story painter. The resolver sanitizes the body, decides whether
 * the image exists, and stamps the layout. DOM order is body-then-media so
 * CSS grid areas can place the image left or right while keeping text first
 * on narrow screens.
 */
export interface PdpStorySectionProps {
  model: PdpStoryViewModel;
  className?: string;
}

export default function PdpStorySection({
  model,
  className = "",
}: PdpStorySectionProps) {
  const style = {
    ...(model.bgColor !== undefined ? { "--section-bg": model.bgColor } : {}),
    ...(model.gutterPx !== undefined
      ? { "--pdp-story-gap": `${model.gutterPx}px` }
      : {}),
    ...(model.ratio !== undefined ? { "--story-ratio": model.ratio } : {}),
    ...(model.imageBlendMode !== undefined
      ? { "--story-blend": model.imageBlendMode }
      : {}),
  } as CSSProperties;

  return (
    <section
      className={`sf-section sf-pdp-story ${className}`}
      style={style}
      aria-label={model.title ?? "Story"}
      data-layout={model.layout}
    >
      <div className="sf-pdp-story__body">
        {model.title !== undefined ? (
          <div className="sf-section__head">
            <h2 className="sf-section__title">{model.title}</h2>
          </div>
        ) : null}
        {model.html !== undefined ? (
          <div
            className="sf-prose sf-pdp-story__copy"
            dangerouslySetInnerHTML={{ __html: model.html }}
          />
        ) : null}
        {model.ctas.length > 0 ? (
          <div className="sf-pdp-story__ctas">
            {model.ctas.map((cta, i) => (
              <Button
                key={`${cta.text}-${i}`}
                href={cta.href}
                variant={cta.variant ?? "primary"}
                bg={cta.bg}
                textColor={cta.textColor}
                borderColor={cta.borderColor}
                borderWidth={cta.borderWidth}
                borderRadius={cta.borderRadius}
              >
                {cta.text}
              </Button>
            ))}
          </div>
        ) : null}
      </div>
      {model.media !== undefined ? (
        <figure className="sf-pdp-story__media">
          <img
            className="sf-pdp-story__img"
            src={model.media.src}
            alt={model.media.alt}
            loading="lazy"
          />
        </figure>
      ) : null}
    </section>
  );
}
