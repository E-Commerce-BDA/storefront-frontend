import Button from "@/components/ui/Button";

/**
 * Dumb inspect actions row — demo Add-to-bag (dynamic label) + Full Page.
 * Demo-grade: onAdd is a callback the owner wires to cart-svc later;
 * no size/stock is invented here (button disables without a pick when
 * sizes exist). props → JSX. No fetch.
 */
export interface SearchInspectActionsProps {
  price: number;
  size: string | null;
  sizesExist: boolean;
  inStock: boolean;
  onAdd?: () => void;
  onFullPage?: () => void;
  className?: string;
}

export default function SearchInspectActions({
  price,
  size,
  sizesExist,
  inStock,
  onAdd,
  onFullPage,
  className = "",
}: SearchInspectActionsProps) {
  const needsPick = sizesExist && size === null;
  const label = needsPick
    ? `Select a size — $${price}`
    : size !== null
      ? `Add Size ${size} to Bag • $${price}`
      : `Add to Bag • $${price}`;
  return (
    <div className={`sf-inspect__actions ${className}`}>
      <Button onClick={onAdd} disabled={needsPick || !inStock} fullWidth>
        {label}
      </Button>
      <Button variant="light" onClick={onFullPage}>
        Full Page
      </Button>
    </div>
  );
}
