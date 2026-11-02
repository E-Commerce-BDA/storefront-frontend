import type { CSSProperties } from "react";
import type { BrandStripViewModel, BrandCellModel } from "@/lib/sections/viewModels";
import { marqueeDurationSeconds } from "@/lib/sections/marquee";

/**
 * BrandStripSection — the logo row, optionally a marquee — sf-060
 *
 * Server-rendered and motion-driven by CSS alone: the track is the same cells
 * painted twice, and the stylesheet translates `-50%` in a loop. That is why
 * `speed` (px/s, the CMS unit) is converted here once — `lib/sections/marquee.ts`
 * owns the arithmetic and the stylesheet owns the keyframes, so neither layer
 * can drift from the other without a test noticing.
 *
 * The two rules that came from the product side, not the CSS side:
 * - **A label is the admin's per-brand choice, not a global toggle.** The logo
 *   and the name sit side by side when `items[].label` was filled in; with no
 *   label the logo stands alone. (`data-named` is the state hook the stylesheet
 *   uses to space them — a state, so it lives in an attr, not a class.)
 * - **A brand with no logo is never an empty cell.** The name paints as a
 *   wordmark instead, which is the honest face of "this brand has no artwork".
 *
 * `prefers-reduced-motion` renders the strip static (CSS), the duplicated copy
 * is `aria-hidden` (a screen reader would read every brand twice), and pausing
 * on hover or focus is a stylesheet rule on `data-pause`.
 */
export interface BrandStripSectionProps {
  model: BrandStripViewModel;
  className?: string;
}

function BrandCell({ brand, ariaHidden }: { brand: BrandCellModel; ariaHidden: boolean }) {
  const inner = (
    <>
      {brand.logo !== undefined ? (
        <img className="sf-strip__logo" src={brand.logo} alt={brand.name} loading="lazy" />
      ) : (
        <span className="sf-strip__wordmark">{brand.name}</span>
      )}
      {brand.label !== undefined ? <span className="sf-strip__label">{brand.label}</span> : null}
    </>
  );

  // "Has a name beside the logo" is a state, so it is an attr — the stylesheet
  // spaces the pair from `[data-named="true"]`, never from a modifier class.
  return brand.href !== undefined ? (
    <a
      className="sf-strip__cell"
      href={brand.href}
      data-named={brand.label !== undefined}
      aria-hidden={ariaHidden || undefined}
      tabIndex={ariaHidden ? -1 : undefined}
    >
      {inner}
    </a>
  ) : (
    <span className="sf-strip__cell" data-named={brand.label !== undefined} aria-hidden={ariaHidden || undefined}>
      {inner}
    </span>
  );
}

export default function BrandStripSection({ model, className = "" }: BrandStripSectionProps) {
  const marquee = model.motion === "marquee";
  const style = {
    ...(model.bgColor !== undefined ? { "--section-bg": model.bgColor } : {}),
    ...(marquee ? { "--marquee-duration": `${marqueeDurationSeconds(model.brands.length, model.speed)}s` } : {}),
  } as CSSProperties;

  const label = model.title ?? "Brands";

  return (
    <section
      className={`sf-section sf-strip ${className}`}
      style={style}
      aria-label={label}
      data-motion={model.motion}
      data-direction={model.direction}
      data-pause={model.pauseOnHover}
    >
      {model.title !== undefined ? (
        <div className="sf-section__head">
          <h2 className="sf-section__title">{model.title}</h2>
        </div>
      ) : null}

      <div className="sf-strip__viewport">
        <div className="sf-strip__track">
          {model.brands.map((brand) => (
            <BrandCell key={brand.id} brand={brand} ariaHidden={false} />
          ))}
          {marquee
            ? model.brands.map((brand) => (
                // The loop copy: same cells, never announced twice, never reachable.
                <BrandCell key={`dup-${brand.id}`} brand={brand} ariaHidden />
              ))
            : null}
        </div>
      </div>
    </section>
  );
}
