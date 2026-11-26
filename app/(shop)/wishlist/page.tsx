import type { Metadata } from "next";
import WishlistView from "../_components/WishlistView";
import { fetchThemeSettings } from "@/lib/cms/theme";
import { resolveThemeSettings, toBadgeTones } from "@/lib/cms/themeSettings";

export const metadata: Metadata = {
  title: "Wishlist",
  description: "View and manage your saved items.",
};

export default async function WishlistPage() {
  const result = await fetchThemeSettings();
  const theme = resolveThemeSettings({ settings: result.theme });
  const cardTheme = theme.productCard;
  return (
    <WishlistView
      columns={{
        desktop: cardTheme.colsDesktop,
        tablet: cardTheme.colsTablet,
        phone: cardTheme.colsPhone,
      }}
      themeFallback={cardTheme}
      tones={toBadgeTones(theme)}
    />
  );
}
