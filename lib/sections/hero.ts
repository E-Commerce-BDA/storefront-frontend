/**
 * Hero model + resolver — sf-051, CMS-driven at sf-060 (sections.md §2/§3).
 *
 * The shape the hero paints. There is deliberately **no default hero any
 * more**: cms-svc owns the copy, so a hero with no slides is a section the
 * resolver skips (`resolveSections`), not a house poem rendered in its place.
 * What lives here is only the geometry the block cannot safely guess — the CTA
 * cap, the ratio fallback, the trim rules.
 *
 * The block stays `props -> JSX`: it calls `resolveHero`, paints the result, and
 * learns nothing about the CMS. `resolveSections` maps a CMS slide to these
 * fields; neither layer knows about the other's consumer.
 */

export type HeroAlign = "left" | "center";
export type HeroRatio = "4:3" | "1:1" | "3:4" | "16:9";
export type HeroHeight = "auto" | "viewport";

export interface HeroCta {
  text: string;
  href: string;
  /** Absent → primary at the block (Button's own default). Capped, never empty-forced. */
  variant?: "primary" | "light" | "ghost-ink";
  /** CMS `ctas[]` paint keys, forwarded flat to `Button` when the admin set them. */
  bg?: string;
  textColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
}

export interface HeroImage {
  src: string;
  /** Required when an image is present — an unnamed hero photo is unusable. */
  alt: string;
  /** Colon form (`"16:9"`) or a plain number (`"1.5"` from `customRatio`). */
  ratio?: string;
}

/** What a caller may pass — the CMS slide already decided the copy. */
export interface HeroFields {
  eyebrow?: string;
  title: string;
  body?: string;
  /** `undefined` and `[]` both mean "no CTA row" now that no copy is invented. */
  ctas?: HeroCta[];
  image?: HeroImage;
  align?: HeroAlign;
  /** sf-060: `viewport` is a CMS knob, not a class — the CSS reads the data attr. */
  height?: HeroHeight;
  /** Admin hex overrides; absent keeps the token fallback in the stylesheet. */
  bgColor?: string;
  textColor?: string;
}

/** What the resolver guarantees the block can rely on. */
export interface ResolvedHero {
  eyebrow?: string;
  title: string;
  body?: string;
  ctas: HeroCta[];
  image?: HeroImage & { ratio: string };
  align: HeroAlign;
  height: HeroHeight;
  bgColor?: string;
  textColor?: string;
}

/** CMS `z.array(ctaSchema).max(3)` mirror — a fourth CTA is dropped, not wrapped. */
export const HERO_CTA_LIMIT = 3;
/** The house media ratio, kept in the CSS form so the resolver has one shape. */
export const HERO_DEFAULT_RATIO = "4 / 3";

/** CMS `ratio` is an enum; the CSS wants `16 / 9`. A plain number passes through. */
export function toCssRatio(ratio: string | undefined): string | undefined {
  if (ratio === undefined || ratio.trim() === "") return undefined;
  return ratio.replace(":", " / ");
}

function trimmed(value: string | undefined): string | undefined {
  return value !== undefined && value.trim() !== "" ? value : undefined;
}

/**
 * Normalise the fields a slide carries into what the block can paint blindly.
 *
 * Three rules the tests pin down:
 * - `ctas` is capped at three, and a CTA with no text or no link is dropped —
 *   a button that goes nowhere is not a call to action.
 * - `image` survives only with a `src`, and its `ratio` gains a fallback so the
 *   block never has to guess; the value it gets is already a CSS form.
 * - whitespace-only copy is absence, so an empty eyebrow renders no element
 *   rather than an empty paragraph above the heading.
 */
export function resolveHero(fields: HeroFields): ResolvedHero {
  const image = fields.image !== undefined && fields.image.src.trim() !== ""
    ? { ...fields.image, ratio: toCssRatio(fields.image.ratio) ?? HERO_DEFAULT_RATIO }
    : undefined;

  const ctas = (fields.ctas ?? [])
    .filter((cta) => cta.text.trim() !== "" && cta.href.trim() !== "")
    .slice(0, HERO_CTA_LIMIT);

  return {
    title: fields.title,
    ...(trimmed(fields.eyebrow) !== undefined ? { eyebrow: fields.eyebrow } : {}),
    ...(trimmed(fields.body) !== undefined ? { body: fields.body } : {}),
    ctas,
    ...(image !== undefined ? { image } : {}),
    align: fields.align === "center" ? "center" : "left",
    height: fields.height === "viewport" ? "viewport" : "auto",
    ...(trimmed(fields.bgColor) !== undefined ? { bgColor: fields.bgColor } : {}),
    ...(trimmed(fields.textColor) !== undefined ? { textColor: fields.textColor } : {}),
  };
}
