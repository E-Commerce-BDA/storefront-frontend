import type { CSSProperties } from "react";
import type { CategoryShowcaseViewModel } from "@/lib/sections/viewModels";

/**
 * CategoryShowcaseSection — the "shop by category" tile row — sf-060
 *
 * Dumb: it paints the resolved tiles and fetches nothing. The href is the
 * listing's own filter vocabulary (`/products?category=<slug>`, routing.md §1),
 * so a tile is a real browse path and not a decorative card.
 *
 * `showPhotos: false` is a deliberate face, not a missing image: the tiles keep
 * their size and become name-only, because an admin who turned photos off asked
 * for less artwork, not for a broken layout.
 */
export interface CategoryShowcaseSectionProps {
  model: CategoryShowcaseViewModel;
  className?: string;
}

export default function CategoryShowcaseSection({ model, className = "" }: CategoryShowcaseSectionProps) {
  const style = {
    ...(model.bgColor !== undefined ? { "--section-bg": model.bgColor } : {}),
    ...(model.gutterPx !== undefined ? { "--grid-gap": `${model.gutterPx}px` } : {}),
  } as CSSProperties;

  return (
    <section
      className={`sf-section sf-showcase ${className}`}
      style={style}
      aria-label={model.title ?? "Shop by category"}
      data-photos={model.showPhotos}
    >
      {model.title !== undefined ? (
        <div className="sf-section__head">
          <h2 className="sf-section__title">{model.title}</h2>
        </div>
      ) : null}

      <ul className="sf-showcase__grid" role="list">
        {model.categories.map((category) => (
          <li key={category.id} className="sf-showcase__item">
            <a className="sf-showcase__tile" href={category.href}>
              {model.showPhotos && category.image !== undefined ? (
                <span className="sf-showcase__media">
                  <img className="sf-showcase__img" src={category.image} alt="" loading="lazy" />
                </span>
              ) : null}
              <span className="sf-showcase__name">{category.name}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
