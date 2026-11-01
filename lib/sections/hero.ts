/**
 * Hero model + resolver — sf-051 (sections.md §2/§3).
 *
 * The home page shows one hero today and a CMS-driven one tomorrow (`sf-060`).
 * Both need the same three decisions — the CTA cap, the ratio fallback, and the
 * house copy a hero with no data still renders — so they live here instead of at
 * the call site, exactly as `clampQty` owns quantity and nothing else does.
 *
 * The block stays `props -> JSX`: it calls `resolveHero`, paints the result, and
 * learns nothing about the CMS. When cms-svc replaces `DEFAULT_HERO`, only the
 * route changes — the resolver and the block do not.
 */

export type HeroAlign = "left" | "center";
export type HeroRatio = "4:3" | "1:1" | "16:9";

export interface HeroCta {
  text: string;
  href: string;
  /** Absent → primary at the block (Button's own default). Capped, never empty-forced. */
  variant?: "primary" | "light";
}

export interface HeroImage {
  src: string;
  /** Required when an image is present — an unnamed hero photo is unusable. */
  alt: string;
  ratio?: HeroRatio;
}

/** What a caller may pass — every field optional except the title. */
export interface HeroFields {
  eyebrow?: string;
  title?: string;
  body?: string;
  /** `undefined` keeps the defaults; `[]` is an explicit "no CTA row". */
  ctas?: HeroCta[];
  image?: HeroImage;
  align?: HeroAlign;
}

/** What the resolver guarantees the block can rely on. */
export interface ResolvedHero {
  eyebrow?: string;
  title: string;
  body?: string;
  ctas: HeroCta[];
  image?: HeroImage & { ratio: HeroRatio };
  align: HeroAlign;
}

/** CMS `z.array(ctaSchema).max(3)` mirror — a fourth CTA is dropped, not wrapped. */
export const HERO_CTA_LIMIT = 3;
export const HERO_DEFAULT_RATIO: HeroRatio = "4:3";

/** The face `/` shows until cms-svc owns hero content (sf-060). */
export const DEFAULT_HERO: ResolvedHero = {
  eyebrow: "New season",
  title: "Everything for every day",
  body: "Handpicked essentials, built to last and priced for the way you actually live.",
  ctas: [
    { text: "Shop now", href: "/products", variant: "primary" },
    { text: "Browse categories", href: "/products", variant: "light" },
  ],
  image: undefined,
  align: "left",
};

function capCtas(ctas: HeroCta[]): HeroCta[] {
  return ctas.slice(0, HERO_CTA_LIMIT);
}

/**
 * Merge a caller's fields over `DEFAULT_HERO` with flat-prop precedence.
 *
 * Three rules the tests pin down:
 * - `ctas` keeps the defaults only when the key is **absent**; `[]` means "no row"
 *   and survives, because an empty CTA row and a missing CTA row are different
 *   requests.
 * - `image` is copied only when it has a `src`; its `ratio` gains a fallback so
 *   the block never has to guess.
 * - `title` is the one required field; an empty/whitespace title falls to the
 *   default rather than rendering a blank `<h1>`.
 */
export function resolveHero(fields: HeroFields | null | undefined = {}): ResolvedHero {
  const input = fields ?? {};

  const title = input.title !== undefined && input.title.trim() !== ""
    ? input.title
    : DEFAULT_HERO.title;

  const ctas = input.ctas !== undefined ? capCtas(input.ctas) : DEFAULT_HERO.ctas;

  let image: ResolvedHero["image"];
  if (input.image && input.image.src.trim() !== "") {
    image = { ...input.image, ratio: input.image.ratio ?? HERO_DEFAULT_RATIO };
  }

  const eyebrow = input.eyebrow ?? DEFAULT_HERO.eyebrow;
  const body = input.body ?? DEFAULT_HERO.body;

  return {
    eyebrow: eyebrow !== undefined && eyebrow.trim() !== "" ? eyebrow : undefined,
    title,
    body: body !== undefined && body.trim() !== "" ? body : undefined,
    ctas,
    image,
    align: input.align === "center" ? "center" : "left",
  };
}
