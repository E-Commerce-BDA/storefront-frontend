"use client";

/**
 * HeroCarousel — the hero's one client island — sf-060
 * (sections.md §3: multi-slide navigation lives above the painter)
 *
 * `HeroSection` is a pure one-slide painter, so this island renders *one of it
 * per slide* and owns nothing but the index. That keeps the paint contract in
 * one stylesheet block (a carousel that re-skinned the hero would drift from it
 * the first time anyone changed a token) and keeps exactly one `<h1>` on the
 * page: inactive slides carry the `hidden` attribute, which takes them out of
 * the a11y tree and out of tab order without a second class vocabulary.
 *
 * Motion rules, all of them deliberate:
 * - **Auto-advance is a courtesy, not a promise.** It stops on hover, on focus
 *   (a shopper reading or tabbing through the CTAs is not an audience), and
 *   when the tab is hidden. `prefers-reduced-motion: reduce` disables it
 *   entirely — the dots stay, because navigation is not motion.
 * - **Slide 1 is `eager`, the rest are `lazy`.** The first slide is the LCP
 *   candidate; preloading a photo behind a hidden slide would pay for a picture
 *   nobody has seen yet.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import HeroSection from "@/components/sections/HeroSection";
import type { HeroSlideModel } from "@/lib/sections/viewModels";
import { toHeroFields } from "@/components/sections/toHeroFields";

/** How long a slide stays up. Long enough to read a subcopy line twice. */
export const HERO_SLIDE_MS = 6000;

export interface HeroCarouselProps {
  slides: HeroSlideModel[];
  height: "auto" | "viewport";
  bgColor?: string;
}

export default function HeroCarousel({ slides, height, bgColor }: HeroCarouselProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useRef(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotion.current = query.matches;
    const onChange = (event: MediaQueryListEvent) => {
      reducedMotion.current = event.matches;
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const go = useCallback((next: number) => {
    setIndex(((next % slides.length) + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const timer = window.setInterval(() => {
      if (reducedMotion.current || document.hidden) return;
      setIndex((current) => (current + 1) % slides.length);
    }, HERO_SLIDE_MS);
    return () => window.clearInterval(timer);
  }, [paused, slides.length]);

  return (
    <div
      className="sf-slideshow"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {slides.map((slide, i) => (
        <div key={slide.id} className="sf-slideshow__slide" hidden={i !== index}>
          <HeroSection
            {...toHeroFields(slide, { height, bgColor })}
            loading={i === 0 ? "eager" : "lazy"}
          />
        </div>
      ))}

      {slides.length > 1 ? (
        <div className="sf-slideshow__dots" role="tablist" aria-label="Choose a slide">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              role="tab"
              className="sf-slideshow__dot"
              aria-selected={i === index}
              aria-label={`Slide ${i + 1} of ${slides.length}`}
              onClick={() => go(i)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
