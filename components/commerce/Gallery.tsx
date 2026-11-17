import type { CSSProperties, KeyboardEvent } from "react";
import {
  GALLERY_DEFAULT_RATIO,
  clampIndex,
  ratioCss,
  stepIndex,
  type GalleryImage,
} from "@/lib/commerce/gallery";
import type { MediaRatio } from "@/lib/commerce/productCard";

/**
 * Dumb Gallery — one frame plus a thumb rail, strictly controlled
 * (product.md §14).
 *
 * The island owns `activeIndex`; this block paints and reports. Ordering,
 * dedupe and alt fallbacks are already done by `lib/commerce/gallery.ts`, so a
 * duplicate upload cannot become a thumb that does nothing.
 *
 * Arrow keys move the frame from wherever focus already is (a thumb), which is
 * why the root carries no `tabIndex`: adding one would put a second focus
 * target in the middle of the page's tab order for no gain. `aria-current`
 * marks the active thumb, `data-active` drives the paint.
 */
export interface GalleryProps {
  images: GalleryImage[];
  activeIndex: number;
  onIndexChange: (index: number) => void;
  /** Same vocabulary as the product card; portrait by default. */
  ratio?: MediaRatio;
  /** `contain` letterboxes a photo whose edges matter; `cover` crops. */
  fit?: "cover" | "contain";
  /** Paint knobs resolved by lib/commerce/photoSettings (sf-055). */
  layout?: "grid" | "carousel";
  gutterPx?: number;
  widthPercent?: number;
  blendMode?: "multiply" | "normal";
  showPhotos?: boolean;
  className?: string;
}

export default function Gallery({
  images,
  activeIndex,
  onIndexChange,
  ratio = GALLERY_DEFAULT_RATIO,
  fit = "cover",
  layout = "carousel",
  gutterPx,
  widthPercent,
  blendMode,
  showPhotos = true,
  className = "",
}: GalleryProps) {
  const index = clampIndex(activeIndex, images.length);
  const active = images[index] ?? null;

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const delta = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (delta === 0 || images.length < 2) return;
    // Only claim the key when there is somewhere to go — the page keeps its
    // horizontal scroll otherwise.
    event.preventDefault();
    onIndexChange(stepIndex(index, delta, images.length));
  };

  return (
    <div
      className={`sf-gallery ${className}`}
      role="group"
      aria-label="Product images"
      data-fit={fit}
      data-layout={layout}
      data-photos={showPhotos}
      onKeyDown={onKeyDown}
      style={
        {
          "--gallery-ratio": ratioCss(ratio),
          ...(gutterPx !== undefined ? { "--gallery-gutter": `${gutterPx}px` } : {}),
          ...(widthPercent !== undefined ? { "--gallery-width": `${widthPercent}%` } : {}),
          ...(blendMode !== undefined ? { "--gallery-blend": blendMode } : {}),
        } as CSSProperties
      }
    >
      <div className="sf-gallery__frame">
        {active && showPhotos ? (
          <img
            className="sf-gallery__img"
            src={active.url}
            alt={active.alt}
            // The first frame is the PDP's LCP; the rest can wait.
            loading={index === 0 ? "eager" : "lazy"}
          />
        ) : (
          <div className="sf-gallery__placeholder" aria-hidden="true" />
        )}
      </div>

      {images.length > 1 ? (
        <div className="sf-gallery__thumbs">
          {images.map((image, position) => (
            <button
              key={image.url}
              type="button"
              className="sf-gallery__thumb"
              aria-label={`Show image ${position + 1}`}
              aria-current={position === index ? "true" : undefined}
              data-active={position === index}
              onClick={() => onIndexChange(position)}
            >
              {/* Decorative: the button's label already says which image. */}
              <img src={image.url} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
