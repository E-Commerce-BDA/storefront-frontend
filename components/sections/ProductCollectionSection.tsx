import type { CSSProperties } from "react";
import ProductGridIsland from "@/components/commerce/ProductGridIsland";
import type { ProductCardData } from "@/lib/commerce/productCard";
import type { ProductCollectionViewModel } from "@/lib/sections/viewModels";

/**
 * ProductCollectionSection — a curated or newest-first product strip — sf-060
 *
 * Dumb: it paints a `product_collection` view model and fetches nothing. The
 * grid itself is the listing's `ProductGridIsland`, so quick-add behaves
 * identically here and on `/products` — one client boundary, one add path.
 *
 * Two seams worth naming:
 * - **Section card knobs sit *under* the product's own `cardSettings`.** The
 *   card resolver's precedence is flat prop → styleConfig → product → theme,
 *   so merging the section overrides in front of the product's dict is what
 *   "the section sets the ratio, the product may disagree" actually means.
 * - **`gutter` becomes `--grid-gap`, not a class.** `.sf-grid` already reads
 *   that var, so an admin gap is a value the stylesheet can still theme.
 */
export interface ProductCollectionSectionProps {
  model: ProductCollectionViewModel;
  className?: string;
}

export default function ProductCollectionSection({ model, className = "" }: ProductCollectionSectionProps) {
  const overrides = model.cardOverrides;
  const cards: ProductCardData[] =
    overrides !== undefined && Object.keys(overrides).length > 0
      ? model.cards.map((card) => ({ ...card, cardSettings: { ...overrides, ...card.cardSettings } }))
      : model.cards;

  const style = {
    ...(model.bgColor !== undefined ? { "--section-bg": model.bgColor } : {}),
    ...(model.gutterPx !== undefined ? { "--grid-gap": `${model.gutterPx}px` } : {}),
  } as CSSProperties;

  const label = model.title ?? "Featured products";

  return (
    <section className={`sf-section sf-collection ${className}`} style={style} aria-label={label} data-layout={model.layout}>
      {model.title !== undefined ? (
        <div className="sf-section__head">
          <h2 className="sf-section__title">{model.title}</h2>
        </div>
      ) : null}
      <ProductGridIsland items={cards} label={label} />
    </section>
  );
}
