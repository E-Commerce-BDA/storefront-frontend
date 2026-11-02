import type { CSSProperties } from "react";
import Button from "@/components/ui/Button";
import { resolveHero, type HeroFields } from "@/lib/sections/hero";

/**
 * Dumb HeroSection — text panel + optional image panel (sections.md §1).
 *
 * `resolveHero(props) -> JSX`, nothing more. No fetch, no carousel, no state:
 * `resolveSections` owns the content and the registry owns multi-slide
 * navigation (`HeroCarousel` mounts *instead of* this block, which is why the
 * block can stay a pure one-slide painter).
 *
 * The copy is never invented here: `title` is required, because a hero the CMS
 * did not write is a hero the resolver already skipped.
 *
 * The CTAs are real `Button`s with an `href`, so they render `<a>` (anchors, not
 * `onClick` navigation — §4.4), and the admin's per-CTA paint keys pass straight
 * through to the Button's flat props. The image is a plain `<img loading="eager">`
 * (LCP; the `ProductCard` no-`next/image` precedent for arbitrary admin hosts),
 * and every layout/paint knob reaches CSS as a var on the section root, so one
 * inline style block covers the slide and its media box.
 */
export interface HeroSectionProps extends HeroFields {
  className?: string;
  /** Non-first carousel slides are painted but hidden; eager only for slide 1. */
  loading?: "eager" | "lazy";
}

export default function HeroSection({
  className = "",
  loading = "eager",
  ...fields
}: HeroSectionProps) {
  const hero = resolveHero(fields);
  const hasImage = hero.image !== undefined;

  const style = {
    ...(hero.bgColor !== undefined ? { "--hero-bg": hero.bgColor } : {}),
    ...(hero.textColor !== undefined ? { "--hero-text": hero.textColor } : {}),
    ...(hero.image !== undefined ? { "--hero-ratio": hero.image.ratio } : {}),
  } as CSSProperties;

  return (
    <section
      className={`sf-hero ${className}`}
      style={style}
      aria-label="Hero"
      data-align={hero.align}
      data-has-image={hasImage}
      data-height={hero.height}
    >
      <div className="sf-hero__text">
        {hero.eyebrow ? <p className="sf-hero__eyebrow">{hero.eyebrow}</p> : null}
        <h1 className="sf-hero__title">{hero.title}</h1>
        {hero.body ? <p className="sf-hero__body">{hero.body}</p> : null}
        {hero.ctas.length > 0 ? (
          <div className="sf-hero__ctas">
            {hero.ctas.map((cta, i) => (
              // A hero can legitimately repeat a destination ("Shop now" and
              // "Browse categories" both → /products), so the href is not a key.
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

      {hero.image ? (
        <div className="sf-hero__media">
          <img
            className="sf-hero__img"
            src={hero.image.src}
            alt={hero.image.alt}
            loading={loading}
          />
        </div>
      ) : null}
    </section>
  );
}
