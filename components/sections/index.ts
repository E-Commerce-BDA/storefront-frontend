/**
 * CMS section blocks — sf-051 (hero) / sf-060 (the rest).
 *
 * Every export here is a dumb painter: it takes a resolved view model from
 * `lib/sections/viewModels` and renders it. Nothing in this directory fetches,
 * and nothing in it knows the word "cms" — the route composes
 * `getSections → resolveSections → SectionRenderer`, and a block that started
 * fetching would put the same orchestration in eight places.
 */
export { default as HeroSection, type HeroSectionProps } from "./HeroSection";
export { default as BannerSection, type BannerSectionProps } from "./BannerSection";
export { default as HeroCarousel, type HeroCarouselProps } from "./HeroCarousel";
export { default as ProductCollectionSection } from "./ProductCollectionSection";
export { default as CategoryShowcaseSection } from "./CategoryShowcaseSection";
export { default as BrandStripSection } from "./BrandStripSection";
export { default as TestimonialSection } from "./TestimonialSection";
export { default as PdpDescriptionSection, type PdpDescriptionSectionProps } from "./PdpDescriptionSection";
export { default as PdpDetailsSection, type PdpDetailsSectionProps } from "./PdpDetailsSection";
export { default as PdpTrustSection, type PdpTrustSectionProps } from "./PdpTrustSection";
export { default as PdpStorySection, type PdpStorySectionProps } from "./PdpStorySection";
export { default as PdpFaqSection, type PdpFaqSectionProps } from "./PdpFaqSection";
export { default as BlogTeaserSection } from "./BlogTeaserSection";
export { default as BlogCard, type BlogCardProps } from "./BlogCard";
export { default as SectionRenderer } from "./SectionRenderer";
export { toHeroFields, type HeroSectionDefaults } from "./toHeroFields";
export type {
  HeroCta,
  HeroImage,
  HeroFields,
  HeroAlign,
  HeroRatio,
  HeroHeight,
  ResolvedHero,
} from "@/lib/sections/hero";
export type {
  SectionViewModel,
  HeroViewModel,
  BannerViewModel,
  HeroSlideModel,
  ProductCollectionViewModel,
  CategoryShowcaseViewModel,
  CategoryTileModel,
  BrandStripViewModel,
  BrandCellModel,
  TestimonialViewModel,
  TestimonialModel,
  ReviewCollectionBase,
  PdpDescriptionViewModel,
  PdpDetailsViewModel,
  PdpDetailRow,
  PdpReviewsViewModel,
  PdpTrustViewModel,
  PdpStoryViewModel,
  PdpFaqViewModel,
  PdpFaqItem,
  BlogTeaserViewModel,
  BlogTeaserCardModel,
  SectionCtaModel,
  SectionCardOverrides,
} from "@/lib/sections/viewModels";
