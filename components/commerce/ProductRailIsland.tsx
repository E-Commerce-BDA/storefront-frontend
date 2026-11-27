"use client";

/**
 * ProductRailIsland — the CMS carousel layout for a product section — sf-091.
 *
 * The CMS schema already distinguishes `grid` from `carousel` for
 * `featured_products` and `pdp_related`, but the renderer used to paint both as
 * a grid. This island is the missing client seam: it owns one number (the
 * current page) in the pure rail machine and hands every interaction back to
 * the dumb `PaginatedRail`. Cards keep the shared `ProductCard` face, so a rail
 * card and a grid card cannot drift; the only difference is the container.
 *
 * Rejected alternatives: one `ProductGridIsland` per card (N quick-add hooks,
 * N timers and N providers for a strip that needs one navigation action), and
 * putting this island in `app/(shop)/_components` (the section block is shared
 * with the PDP, so a route-group import would invert the depth gradient).
 */
import { useReducer } from "react";
import { useRouter } from "next/navigation";
import ProductCard from "@/components/commerce/ProductCard";
import { PaginatedRail } from "@/components/ui";
import type { ProductCardData } from "@/lib/commerce/productCard";
import type { GridColumns } from "@/lib/commerce/fromCatalog";
import type { ResolvedThemeProductCard } from "@/lib/cms/themeSettings";
import {
  initialRailIndexMachine,
  railIndexMachine,
} from "@/lib/sections/machine";

export interface ProductRailIslandProps {
  cards: readonly ProductCardData[];
  label: string;
  columns?: Partial<GridColumns>;
  themeFallback?: ResolvedThemeProductCard;
  tones?: React.ComponentProps<typeof ProductCard>["tones"];
}

export default function ProductRailIsland({
  cards,
  label,
  themeFallback,
  tones,
}: ProductRailIslandProps) {
  const router = useRouter();
  const [{ index }, dispatch] = useReducer(
    railIndexMachine,
    undefined,
    initialRailIndexMachine,
  );

  const items = cards.map((card) => (
    <ProductCard
      key={card.id}
      product={card}
      themeFallback={themeFallback}
      tones={tones}
      onOpen={(p) => {
        if (p.url) router.push(p.url);
      }}
    />
  ));

  const setIndex = (next: number) =>
    dispatch({ type: "rail/set", index: next, count: cards.length });

  return (
    <div className="sf-collection__rail" data-layout="carousel">
      <PaginatedRail
        items={items}
        index={index}
        pageCount={cards.length}
        onIndexChange={setIndex}
        loop
        label={label}
      />
    </div>
  );
}

