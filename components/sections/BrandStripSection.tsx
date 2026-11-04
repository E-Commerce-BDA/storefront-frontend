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
 * - **The brand name always reads on one line.** The wordmark is the cell's
 *   anchor; `items[].label` is the admin's optional override of that name, so a
 *   brand is never shown twice (the old label-beside-wordmark duplicated it).
 * - **The logo is an admin-customizable mark beside the name, not a replacement
 *   for it.** When `brand.logo` is set it paints as a small icon next to the
 *   wordmark; with no artwork the name stands alone (never an empty cell).
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
      <span className="sf-strip__wordmark">{brand.label ?? brand.name}</span>
      {brand.logo !== undefined ? (
        // The admin-customizable brand mark sits beside the name as a decorative
        // icon; the wordmark already names the brand for assistive tech.
        <img className="sf-strip__logo" src={brand.logo} alt="" aria-hidden="true" loading="lazy" />
      ) : null}
    </>
  );

  return brand.href !== undefined ? (
    <a
      className="sf-strip__cell"
      href={brand.href}
      aria-hidden={ariaHidden || undefined}
      tabIndex={ariaHidden ? -1 : undefined}
    >
      {inner}
    </a>
  ) : (
    <span className="sf-strip__cell" aria-hidden={ariaHidden || undefined}>
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
