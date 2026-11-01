import type { Metadata } from "next";
import HeroSection from "@/components/sections/HeroSection";
import FeaturedGrid from "./_components/FeaturedGrid";

/**
 * `/` — the home teaser (plan §8; A1).
 *
 * Static with a 60-second revalidation: the hero is `DEFAULT_HERO` (cms-svc
 * owns its content at sf-060) and the product strip is the newest 8 active
 * products, fetched server-side like every other catalog read (decision 5).
 * This is the page that replaces "under construction".
 */

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Everything for every day",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <div className="grid gap-12">
      <HeroSection />
      <FeaturedGrid />
    </div>
  );
}
