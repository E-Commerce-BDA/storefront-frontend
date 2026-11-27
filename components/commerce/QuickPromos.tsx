import Pill from "@/components/ui/Pill";
import { resolveQuickPromos } from "@/lib/cart/promos";

/**
 * Dumb QuickPromos — the prototype's one-tap coupon suggestions. Every pill
 * reports a code; validation stays with the cart island and its BFF call.
 */
export interface QuickPromosProps {
  applied?: string;
  onPick: (code: string) => void;
  className?: string;
}

export default function QuickPromos({ applied, onPick, className = "" }: QuickPromosProps) {
  const promos = resolveQuickPromos(applied);
  return (
    <div className={`sf-quickpromos ${className}`} role="group" aria-label="Suggested promo codes">
      <span className="sf-quickpromos__label">Try:</span>
      {promos.map((promo) => (
        <Pill
          key={promo.code}
          variant="chip"
          active={promo.active}
          onClick={() => onPick(promo.code)}
        >
          {promo.code}
        </Pill>
      ))}
    </div>
  );
}
