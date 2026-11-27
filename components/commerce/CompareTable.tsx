import Link from "next/link";
import type { ProductCardData } from "@/lib/commerce/productCard";
import { compareRows, visibleCompareRows } from "@/lib/commerce/compare";

/**
 * Dumb comparison table — sf-081 (A3.7), differences-only face added sf-094.
 * One column per product, one row per attribute; the media cell is the same
 * `.sf-productcard__media` the card uses, so a cover image and its solid
 * fallback cannot drift between the two faces. Row selection is decided by the
 * pure resolver in lib, never by a ternary in the painter.
 */
export interface CompareTableProps {
  items: ProductCardData[];
  differencesOnly?: boolean;
  className?: string;
}

export default function CompareTable({
  items,
  differencesOnly = false,
  className = "",
}: CompareTableProps) {
  const rows = visibleCompareRows(
    compareRows(
      items.map((item) => ({
        price: item.price,
        ...(item.compareAt !== undefined ? { compareAt: item.compareAt } : {}),
        category: item.category ?? "",
        ...(item.brand?.name !== undefined ? { brandName: item.brand.name } : {}),
        ...(item.rating !== undefined ? { rating: item.rating } : {}),
        ...(item.stock !== undefined ? { stock: item.stock } : {}),
      })),
    ),
    differencesOnly,
  );

  return (
    <div className={`sf-compare ${className}`} data-differences-only={differencesOnly}>
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
          {rows.map((row) => (
            <tr key={row.label}>
              <th scope="row" className="sf-compare__rowhead">{row.label}</th>
              {row.values.map((value, index) => (
                <td key={`${row.label}-${index}`} className="sf-compare__cell">{value}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
