
import type { PdpTrustItem, Section } from "@ecom/contracts";
import type { ProductCardData, ProductCardStyleConfig } from "@/lib/commerce/productCard";

/**
 * Section-level card knobs, typed with the card's own vocabulary so a CMS
 * value that the card resolver would reject can never be smuggled through here.
 */
export type SectionCardOverrides = Partial<
  Pick<ProductCardStyleConfig, "mediaRatio" | "imageBlendMode">
>;

export interface SectionCtaModel {
  text: string;
  href: string;
  variant: "primary" | "light" | "ghost-ink";
  bg?: string;
  textColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
}

export interface HeroSlideModel {
  id: string;
  eyebrow?: string;
  headline: string;
  subcopy?: string;
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
  ariaLabel?: string;
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
  date?: string;
}

export interface ReviewCollectionBase {
  key: string;
  title?: string;
  items: TestimonialModel[];
  layout: "grid" | "marquee";
  speed: number;
  pauseOnHover: boolean;
  bgColor?: string;
}

export interface TestimonialViewModel extends ReviewCollectionBase {
  type: "testimonial";
}

export interface PdpReviewsViewModel extends ReviewCollectionBase {
  type: "pdp_reviews";
  anchorId?: "reviews";
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

export interface PdpDescriptionViewModel {
  key: string;
  type: "pdp_description";
  title?: string;
  html?: string;
  text?: string;
  layout: "prose" | "wide";
  gutterPx?: number;
  bgColor?: string;
}

export interface PdpDetailRow {
  label: string;
  value: string;
}

export interface PdpDetailsViewModel {
  key: string;
  type: "pdp_details";
  title?: string;
  rows: PdpDetailRow[];
  columns: number;
  gutterPx?: number;
  bgColor?: string;
}

export interface PdpTrustViewModel {
  key: string;
  type: "pdp_trust";
  title?: string;
  items: PdpTrustItem[];
  layout: "rows" | "grid";
  showIcons: boolean;
  gutterPx?: number;
  bgColor?: string;
}

export interface PdpStoryViewModel {
  key: string;
  type: "pdp_story";
  title?: string;
  html?: string;
  media?: { src: string; alt: string };
  ctas: SectionCtaModel[];
  layout: "text" | "image-left" | "image-right";
  ratio?: string;
  imageBlendMode?: "multiply" | "normal";
  gutterPx?: number;
  bgColor?: string;
}

export interface PdpFaqItem {
  question: string;
  answer: string;
}

export interface PdpFaqViewModel {
  key: string;
  type: "pdp_faq";
  title?: string;
  items: PdpFaqItem[];
  layout: "accordion" | "list";
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
  | BlogTeaserViewModel
  | PdpDescriptionViewModel
  | PdpDetailsViewModel
  | PdpReviewsViewModel
  | PdpTrustViewModel
  | PdpStoryViewModel
  | PdpFaqViewModel;

export type SectionType = Section["type"];
