import type { CSSProperties } from "react";
import Button from "@/components/ui/Button";
import { resolveHero, type HeroFields } from "@/lib/sections/hero";

/**
 * Dumb HeroSection — text panel + optional image panel (sections.md §1).
 *
 * `resolveHero(props) -> JSX`, nothing more. No fetch, no carousel, no state:
 * the home route owns the content (today `DEFAULT_HERO`, cms-svc at sf-060),
 * and the block only paints it. Multi-slide navigation is a caller-owned prop
 * pair when it lands, the same reason Gallery stays controlled.
 *
 * The CTAs are real `Button`s with an `href`, so they render `<a>` (anchors, not
 * `onClick` navigation — §4.4). The image is a plain `<img loading="eager">`
 * (LCP; the `ProductCard` no-`next/image` precedent for arbitrary admin hosts),
 * and its ratio reaches CSS as the `--hero-ratio` var the block sets inline.
 */
export interface HeroSectionProps extends HeroFields {
  className?: string;
}

export default function HeroSection({ className = "", ...fields }: HeroSectionProps) {
  const hero = resolveHero(fields);
  const hasImage = hero.image !== undefined;

  return (
    <section
      className={`sf-hero ${className}`}
      aria-label="Hero"
      data-align={hero.align}
      data-has-image={hasImage}
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
              <Button key={`${cta.text}-${i}`} href={cta.href} variant={cta.variant}>
                {cta.text}
              </Button>
            ))}
          </div>
        ) : null}
      </div>

      {hero.image ? (
        <div
          className="sf-hero__media"
          style={{ "--hero-ratio": hero.image.ratio.replace(":", " / ") } as CSSProperties}
        >
          <img className="sf-hero__img" src={hero.image.src} alt={hero.image.alt} loading="eager" />
        </div>
      ) : null}
    </section>
  );
}
