import type { CSSProperties } from "react";
import type {
  ReviewCollectionBase,
  TestimonialModel,
} from "@/lib/sections/viewModels";
import { formatMonthYear, starCells, STAR_COUNT } from "@/lib/sections/present";
import {
  marqueeDurationSeconds,
  MARQUEE_QUOTE_CELL_PX,
  MARQUEE_QUOTE_GAP_PX,
} from "@/lib/sections/marquee";

/**
 * TestimonialSection — reviews the CMS wrote, not reviews we invented — sf-060
 *
 * Every row is a `testimonial.items[]` entry the admin entered: the quote, the
 * name, the optional rating/verified/date. Nothing here is synthesised — no
 * fake "4.8 average", no star that the CMS did not say. An item without a
 * rating simply has no star row.
 *
 * `layout: "marquee"` reuses the strip's duplicated-track mechanism (same
 * `-50%` loop, same pause and reduced-motion rules), so the second motion
 * feature costs one var and no new CSS vocabulary.
 */
export interface TestimonialSectionProps {
  model: ReviewCollectionBase;
  id?: string;
  className?: string;
}

function Stars({ rating }: { rating: number | undefined }) {
  const cells = starCells(rating);
  if (cells === undefined) return null;
  const filled = cells.filter(Boolean).length;
  return (
    <span className="sf-stars" role="img" aria-label={`Rated ${filled} out of ${STAR_COUNT}`}>
      {cells.map((on, i) => (
        <span key={i} className="sf-stars__star" data-on={on} aria-hidden="true">
          ★
        </span>
      ))}
    </span>
  );
}

function Review({ item, ariaHidden }: { item: TestimonialModel; ariaHidden: boolean }) {
  const date = formatMonthYear(item.date);
  return (
    <figure className="sf-quote" aria-hidden={ariaHidden || undefined}>
      <Stars rating={item.rating} />
      <blockquote className="sf-quote__text">{item.quote}</blockquote>
      <figcaption className="sf-quote__by">
        {item.avatar !== undefined ? (
          <img className="sf-quote__avatar" src={item.avatar} alt="" loading="lazy" />
        ) : null}
        <span className="sf-quote__who">
          <span className="sf-quote__name">{item.name}</span>
          {item.role !== undefined ? <span className="sf-quote__role">{item.role}</span> : null}
        </span>
        <span className="sf-quote__meta">
          {item.verified === true ? <span className="sf-pill sf-testimonial__badge">Verified</span> : null}
          {date !== undefined ? (
            <time className="sf-quote__date" dateTime={item.date}>
              {date}
            </time>
          ) : null}
        </span>
      </figcaption>
    </figure>
  );
}

export default function TestimonialSection({ model, id, className = "" }: TestimonialSectionProps) {
  const marquee = model.layout === "marquee";
  const style = {
    ...(model.bgColor !== undefined ? { "--section-bg": model.bgColor } : {}),
    ...(marquee
      ? {
          "--marquee-duration": `${marqueeDurationSeconds(
            model.items.length,
            model.speed,
            MARQUEE_QUOTE_CELL_PX,
            MARQUEE_QUOTE_GAP_PX,
          )}s`,
        }
      : {}),
  } as CSSProperties;

  return (
    <section
      id={id}
      className={`sf-section sf-testimonials ${className}`}
      style={style}
      aria-label={model.title ?? "What shoppers say"}
      data-layout={model.layout}
      data-pause={model.pauseOnHover}
    >
      {model.title !== undefined ? (
        <div className="sf-section__head">
          <h2 className="sf-section__title">{model.title}</h2>
        </div>
      ) : null}

      {marquee ? (
        <div className="sf-testimonials__viewport">
          <div className="sf-testimonials__track">
            {model.items.map((item) => (
              <Review key={item.id} item={item} ariaHidden={false} />
            ))}
            {model.items.map((item) => (
              <Review key={`dup-${item.id}`} item={item} ariaHidden />
            ))}
          </div>
        </div>
      ) : (
        <div className="sf-testimonials__grid">
          {model.items.map((item) => (
            <Review key={item.id} item={item} ariaHidden={false} />
          ))}
        </div>
      )}
    </section>
  );
}
