// @vitest-environment jsdom
/**
 * BannerSection contract — sections.md §2.
 *
 * The block is a dumb painter: it renders exactly the CMS view model, keeps the
 * image's admin alt text, positions content by the resolved align, and forwards
 * CTA paint keys to Button. Emptiness is the resolver's job, so a model that
 * reaches the block always has media.
 */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import BannerSection from "@/components/sections/BannerSection";
import type { BannerViewModel } from "@/lib/sections/viewModels";

afterEach(cleanup);

const banner = (over: Partial<BannerViewModel> = {}): BannerViewModel => ({
  key: "promo",
  type: "banner",
  title: "Sale",
  subcopy: "While it lasts",
  media: { src: "/media/seed/promo.jpg", alt: "Promo artwork" },
  align: "right",
  ctas: [{ text: "Shop the sale", href: "/products", variant: "primary" }],
  ...over,
});

describe("BannerSection", () => {
  it("paints the CMS copy, media, alignment and CTA", () => {
    const { container } = render(<BannerSection model={banner()} />);
    const section = container.querySelector(".sf-banner") as HTMLElement;
    expect(section.getAttribute("data-align")).toBe("right");
    expect(screen.getByRole("heading", { name: "Sale" })).not.toBeNull();
    expect(screen.getByText("While it lasts")).not.toBeNull();

    const img = container.querySelector(".sf-banner__img") as HTMLImageElement;
    expect(img.getAttribute("src")).toBe("/media/seed/promo.jpg");
    expect(img.getAttribute("alt")).toBe("Promo artwork");

    const cta = screen.getByRole("link", { name: "Shop the sale" });
    expect(cta.getAttribute("href")).toBe("/products");
    expect(cta.textContent).toBe("Shop the sale");
  });

  it("reaches the stylesheet through CSS vars only", () => {
    const { container } = render(
      <BannerSection model={banner({ bgColor: "#10233f", imageBlendMode: "multiply" })} />,
    );
    const section = container.querySelector(".sf-banner") as HTMLElement;
    expect(section.style.getPropertyValue("--banner-bg")).toBe("#10233f");
    expect(section.style.getPropertyValue("--banner-blend")).toBe("multiply");
  });

  it("paints nothing for absent optional copy", () => {
    const { container } = render(
      <BannerSection model={banner({ title: undefined, subcopy: undefined, ctas: [] })} />,
    );
    expect(container.querySelector(".sf-banner__title")).toBeNull();
    expect(container.querySelector(".sf-banner__body")).toBeNull();
    expect(container.querySelector(".sf-banner__ctas")).toBeNull();
  });
});
