import Link from "next/link";
import type { ProductCardData } from "@/lib/commerce/productCard";

/**
 * Dumb comparison table — sf-081 (A3.7). One column per product, one row per
 * attribute; the media cell is the same `.sf-productcard__media` the card uses,
 * so a cover image and its solid fallback cannot drift between the two faces.
 * All decisions (which products, which order) are the route's.
 */
export interface CompareTableProps {
  items: ProductCardData[];
  className?: string;
}

const ROWS: ReadonlyArray<{ label: string; value: (p: ProductCardData) => string }> = [
  { label: "Price", value: (p) => `$${p.price}` },
  { label: "Was", value: (p) => (p.compareAt ? `$${p.compareAt}` : "—") },
  { label: "Category", value: (p) => p.category || "—" },
  { label: "Brand", value: (p) => p.brand?.name ?? "—" },
  { label: "Rating", value: (p) => (p.rating !== undefined ? `${p.rating} / 5` : "—") },
  { label: "Availability", value: (p) => (p.stock === "out" ? "Out of stock" : "Available") },
];

export default function CompareTable({ items, className = "" }: CompareTableProps) {
  return (
    <div className={`sf-compare ${className}`}>
      <table className="sf-compare__table" aria-label="Product comparison">
        <thead>
          <tr>
            <th scope="col" className="sf-compare__corner">Attribute</th>
            {items.map((item) => (
              <th scope="col" key={item.id} className="sf-compare__col">
                <Link href={item.url ?? `/products/${encodeURIComponent(item.name)}`}>
                  <span className="sf-productcard__media sf-compare__media">
                    {item.image !== "" ? <img src={item.image} alt="" loading="lazy" /> : null}
                  </span>
                  <span className="sf-compare__name">{item.name}</span>
                </Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.label}>
              <th scope="row" className="sf-compare__rowhead">{row.label}</th>
              {items.map((item) => (
                <td key={item.id} className="sf-compare__cell">{row.value(item)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
