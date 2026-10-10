import type { ProductDetail } from "@/lib/search/pdp";
import type { PreviewStatus } from "@/app/hooks/useInspectPreview";

/**
 * Dumb inspect preview region — badge, image, lookbook chip, department,
 * price, description. Skeleton on loading, nothing on null (absent data,
 * absent preview — the panel never invents content). Size selection lives
 * here as controlled pills; stock gates nothing visually except its line.
 * props → JSX. No fetch.
 */
export interface SearchInspectPreviewProps {
  detail: ProductDetail | null;
  status?: PreviewStatus;
  selectedSize?: string | null;
  onSize?: (s: string) => void;
  className?: string;
}

export default function SearchInspectPreview({
  detail,
  status = "idle",
  selectedSize = null,
  onSize,
  className = "",
}: SearchInspectPreviewProps) {
  if (status === "loading") {
    return (
      <div className={`sf-inspect__preview ${className}`} aria-busy="true" aria-label="Loading preview">
        <div className="sf-inspect__skel-image" aria-hidden="true" />
        <div className="sf-inspect__skel-line" aria-hidden="true" />
        <div className="sf-inspect__skel-line sf-inspect__skel-short" aria-hidden="true" />
      </div>
    );
  }
  if (detail === null) {
    return null;
  }
  return (
    <div className={`sf-inspect__preview ${className}`}>
      <div className="sf-inspect__photo">
        {detail.tag && <span className="sf-inspect__photobadge">{detail.tag}</span>}
        {detail.image !== "" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={detail.image} alt={detail.name} />
        ) : (
          <span className="sf-inspect__photoname" aria-hidden="true">
            {detail.name.charAt(0)}
          </span>
        )}
        <span className="sf-inspect__lookbook">Live Lookbook Preview</span>
      </div>
      <p className="sf-inspect__dept">
        {detail.category} Department <span className="sf-inspect__price">${detail.price}</span>
      </p>
      <h3 className="sf-inspect__title">{detail.name}</h3>
      <p className="sf-inspect__desc">{detail.description}</p>
      {detail.sizes.length > 1 && (
        <div className="sf-inspect__sizes" role="group" aria-label="Select size">
          <span className="sf-inspect__sizes-label">Select Size:</span>
          {detail.sizes.map((s) => (
            <button
              key={s}
              type="button"
              data-active={s === selectedSize}
              onClick={() => onSize?.(s)}
              aria-pressed={s === selectedSize}
            >
              {s}
            </button>
          ))}
        </div>
      )}
      <p className="sf-inspect__stock" data-instock={detail.stock > 0}>
        {detail.stock > 0 ? "● In Stock (Ships today)" : "○ Out of stock"}
      </p>
    </div>
  );
}
