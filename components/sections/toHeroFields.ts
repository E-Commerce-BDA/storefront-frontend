/**
 * CMS slide → `HeroSection` props — sf-060
 *
 * The one adapter between the CMS slide shape (`headline`, `subcopy`, `media`)
 * and the painter's flat-prop vocabulary (`title`, `body`, `image`). It is a
 * separate file because both `HeroSection` (single-slide home hero) and the
 * client `HeroCarousel` need it, and a client island must not import a
 * server-only module to get one mapping.
 *
 * Section-level knobs (`height`, `bgColor`) are applied only when the slide did
 * not carry its own — a slide that set a background outranks the section.
 */
import type { HeroFields } from "@/lib/sections/hero";
import type { HeroSlideModel } from "@/lib/sections/viewModels";

export interface HeroSectionDefaults {
  height?: "auto" | "viewport";
  bgColor?: string;
  textColor?: string;
  align?: "left" | "center";
}

export function toHeroFields(
  slide: HeroSlideModel,
  defaults: HeroSectionDefaults = {},
): HeroFields {
  return {
    title: slide.headline,
    ...(slide.eyebrow !== undefined ? { eyebrow: slide.eyebrow } : {}),
    ...(slide.subcopy !== undefined ? { body: slide.subcopy } : {}),
    ...(slide.media !== undefined
      ? { image: { src: slide.media.src, alt: slide.media.alt, ...(slide.ratio !== undefined ? { ratio: slide.ratio } : {}) } }
      : {}),
    ...(slide.ctas.length > 0 ? { ctas: slide.ctas } : {}),
    ...(slide.bgColor !== undefined ? { bgColor: slide.bgColor } : defaults.bgColor !== undefined ? { bgColor: defaults.bgColor } : {}),
    ...(slide.textColor !== undefined ? { textColor: slide.textColor } : defaults.textColor !== undefined ? { textColor: defaults.textColor } : {}),
    height: defaults.height ?? "auto",
    align: defaults.align ?? "left",
  };
}
