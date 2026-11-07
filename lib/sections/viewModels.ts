/**
 * Section view models — sf-060
 * (Documentation/components/sections.md §2; plan §6)
 *
 * The seam between the CMS contract and the dumb blocks. A `SectionViewModel`
 * says *"paint exactly this"*: every id has been resolved to a row, every
 * absent style key has been left absent on purpose (absent means "inherit the
 * theme token" — resolving it here would freeze the theme out of the CSS-var
 * precedence chain, the same rule `fromCatalog.toCardSettings` follows for
 * cards), and nothing below this layer fetches, decides, or knows the word
 * "cms".
 *
 * `key` and `type` are stamped by the resolver for the renderer registry;
 * a section the resolver drops (inactive, empty, or its service was down)
 * simply never becomes a view model — "empty ≠ outage" is decided once, in
 * `resolveSections`, not five times in JSX.
 */

import type { Section } from "@ecom/contracts";
import type { ProductCardData, ProductCardStyleConfig } from "@/lib/commerce/productCard";

/**
 * Section-level card knobs, typed with the card's own vocabulary so a CMS
 * value that the card resolver would reject can never be smuggled through here.
 */
export type SectionCardOverrides = Partial<
  Pick<ProductCardStyleConfig, "mediaRatio" | "imageBlendMode">
>;

/** Post-CTA-shape: the contract's `link` has become the href the `<a>` takes. */
export interface SectionCtaModel {
  text: string;
  href: string;
  /** Index-derived house variant; per-CTA colors override it at the Button. */
  variant: "primary" | "light" | "ghost-ink";
  bg?: string;
  textColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
}

/** `ratio`/`customRatio` were merged into one CSS `aspect-ratio` value. */
export interface HeroSlideModel {
  id: string;
  eyebrow?: string;
  headline: string;
  subcopy?: string;
  /** Present only when the slide has a usable image ref; alt may be "". */
  media?: { src: string; alt: string };
  ratio?: string;
  bgColor?: string;
  textColor?: string;
  ctas: SectionCtaModel[];
}

export interface HeroViewModel {
  key: string;
  type: "hero";
  slides: HeroSlideModel[];
  height: "auto" | "viewport";
  bgColor?: string;
}

export interface BannerViewModel {
  key: string;
  type: "banner";
  title?: string;
  subcopy?: string;
  media: { src: string; alt: string };
  align: "left" | "center" | "right";
  ctas: SectionCtaModel[];
  bgColor?: string;
  imageBlendMode?: "multiply" | "normal";
}

export interface ProductCollectionViewModel {
  key: string;
  type: "product_collection";
  title?: string;
  /** Already ordered (manual picks keep the CMS order; newest is created_desc). */
  cards: ProductCardData[];
  layout: "grid" | "carousel";
  gutterPx?: number;
  bgColor?: string;
  /** Sparse section-level card knobs; `undefined` values are never set, so the
   * per-product `cardSettings` and the theme stay in their precedence spots. */
  cardOverrides?: SectionCardOverrides;
}

export interface CategoryTileModel {
  id: string;
  name: string;
  href: string;
  image?: string;
}

export interface CategoryShowcaseViewModel {
  key: string;
  type: "category_showcase";
  title?: string;
  categories: CategoryTileModel[];
  showPhotos: boolean;
  gutterPx?: number;
  bgColor?: string;
}

export interface BrandCellModel {
  id: string;
  /** Admin's override of the displayed name (the per-item `label`); when absent
   * the cell shows `name`. It never renders as a second text beside the name. */
  label?: string;
  /** Admin-customizable brand mark, painted as a small icon beside the name. */
  logo?: string;
  /** The brand's real name — always shown (single line), so a logoless brand is
   * never an empty cell. */
  name: string;
  href?: string;
}

export interface BrandStripViewModel {
  key: string;
  type: "brand_strip";
  title?: string;
  brands: BrandCellModel[];
  motion: "static" | "marquee";
  speed: number;
  direction: "left" | "right";
  pauseOnHover: boolean;
  bgColor?: string;
}

export interface TestimonialModel {
  id: string;
  quote: string;
  name: string;
  role?: string;
  avatar?: string;
  rating?: number;
  verified?: boolean;
  /** ISO date, rendered as a month/year line — never the raw string twice. */
  date?: string;
}

export interface TestimonialViewModel {
  key: string;
  type: "testimonial";
  title?: string;
  items: TestimonialModel[];
  layout: "grid" | "marquee";
  speed: number;
  pauseOnHover: boolean;
  bgColor?: string;
}

export interface BlogTeaserCardModel {
  slug: string;
  title: string;
  href: string;
  excerpt?: string;
  cover?: string;
  publishedAt?: string;
}

export interface BlogTeaserViewModel {
  key: string;
  type: "blog_teaser";
  title?: string;
  posts: BlogTeaserCardModel[];
  gutterPx?: number;
  bgColor?: string;
}

export type SectionViewModel =
  | HeroViewModel
  | BannerViewModel
  | ProductCollectionViewModel
  | CategoryShowcaseViewModel
  | BrandStripViewModel
  | TestimonialViewModel
  | BlogTeaserViewModel;

/** The registry key type — same strings as the CMS union, no sixth vocabulary. */
export type SectionType = Section["type"];
