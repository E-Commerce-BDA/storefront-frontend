import type { CSSProperties } from "react";
import Button from "@/components/ui/Button";
import type { BannerViewModel } from "@/lib/sections/viewModels";

/**
 * Dumb BannerSection — one full-width image band with CMS copy and CTAs.
 *
 * `resolveSections` owns the CMS mapping; this block only paints the view
 * model. The image is a plain `<img>` (arbitrary admin/CMS hosts, same
 * precedent as `HeroSection`), and every paint knob reaches CSS as a var on the
 * root so the block stays props → JSX.
 */
export interface BannerSectionProps {
  model: BannerViewModel;
  className?: string;
}

export default function BannerSection({ model, className = "" }: BannerSectionProps) {
  const style = {
    ...(model.bgColor !== undefined ? { "--banner-bg": model.bgColor } : {}),
    ...(model.imageBlendMode !== undefined ? { "--banner-blend": model.imageBlendMode } : {}),
  } as CSSProperties;

  return (
    <section
      className={`sf-section sf-banner ${className}`}
      style={style}
      aria-label={model.title ?? "Banner"}
      data-align={model.align}
    >
      <div className="sf-banner__media">
        <img className="sf-banner__img" src={model.media.src} alt={model.media.alt} loading="lazy" />
      </div>
      <div className="sf-banner__scrim" aria-hidden="true" />

      <div className="sf-banner__content">
        {model.title !== undefined ? <h2 className="sf-banner__title">{model.title}</h2> : null}
        {model.subcopy !== undefined ? <p className="sf-banner__body">{model.subcopy}</p> : null}
        {model.ctas.length > 0 ? (
          <div className="sf-banner__ctas">
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
    </section>
  );
}
