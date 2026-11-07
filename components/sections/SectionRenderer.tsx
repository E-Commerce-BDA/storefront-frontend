import BannerSection from "@/components/sections/BannerSection";
import BlogTeaserSection from "@/components/sections/BlogTeaserSection";
import BrandStripSection from "@/components/sections/BrandStripSection";
import CategoryShowcaseSection from "@/components/sections/CategoryShowcaseSection";
import HeroCarousel from "@/components/sections/HeroCarousel";
import HeroSection from "@/components/sections/HeroSection";
import ProductCollectionSection from "@/components/sections/ProductCollectionSection";
import TestimonialSection from "@/components/sections/TestimonialSection";
import { toHeroFields } from "@/components/sections/toHeroFields";
import type { GridColumns } from "@/lib/commerce/fromCatalog";
import type { ResolvedThemeProductCard } from "@/lib/cms/themeSettings";
import type { HeroViewModel, SectionViewModel } from "@/lib/sections/viewModels";

/**
 * SectionRenderer — the type-keyed registry — sf-060
 *
 * The home page renders `models.map(render)` and knows nothing about what a
 * section *is*. A switch, not an object of components, because the props differ
 * per type: a registry table would need a cast per row, and a cast in the one
 * file that dispatches every CMS feature is exactly where a wrong type hides.
 *
 * The registry has one case per view-model type; the default branch is a
 * compile-time statement, not a runtime fallback.
 */
function HeroBlock({ model }: { model: HeroViewModel }) {
  if (model.slides.length > 1) {
    return (
      <HeroCarousel slides={model.slides} height={model.height} bgColor={model.bgColor} />
    );
  }
  const slide = model.slides[0];
  if (slide === undefined) return null; // `heroModel` guarantees ≥1; paint nothing rather than crash.
  return <HeroSection {...toHeroFields(slide, { height: model.height, bgColor: model.bgColor })} />;
}

export interface SectionRendererProps {
  models: readonly SectionViewModel[];
  columns?: Partial<GridColumns>;
  themeFallback?: ResolvedThemeProductCard;
  tones?: React.ComponentProps<typeof ProductCollectionSection>["tones"];
}

export default function SectionRenderer({ models, columns, themeFallback, tones }: SectionRendererProps) {
  return (
    <>
      {models.map((model) => {
        switch (model.type) {
          case "hero":
            return <HeroBlock key={model.key} model={model} />;
          case "banner":
            return <BannerSection key={model.key} model={model} />;
          case "product_collection":
            return (
              <ProductCollectionSection
                key={model.key}
                model={model}
                columns={columns}
                themeFallback={themeFallback}
                tones={tones}
              />
            );
          case "category_showcase":
            return <CategoryShowcaseSection key={model.key} model={model} />;
          case "brand_strip":
            return <BrandStripSection key={model.key} model={model} />;
          case "testimonial":
            return <TestimonialSection key={model.key} model={model} />;
          case "blog_teaser":
            return <BlogTeaserSection key={model.key} model={model} />;
          default:
            // The compile-time guard: a new section type in `viewModels` makes
            // this line an error instead of becoming a silently missing block.
            return assertNever(model);
        }
      })}
    </>
  );
}

function assertNever(model: never): null {
  void model;
  return null;
}
