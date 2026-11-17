// @vitest-environment jsdom
/**
 * PDP section blocks — contract tests.
 *
 * The components are dumb painters: copy comes from the view model, layout
 * reaches CSS through data attrs/vars, and the trust icons are typed (never
 * cast). Emptiness remains the resolver's job.
 */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import PdpDescriptionSection from "@/components/sections/PdpDescriptionSection";
import PdpDetailsSection from "@/components/sections/PdpDetailsSection";
import PdpFaqSection from "@/components/sections/PdpFaqSection";
import PdpStorySection from "@/components/sections/PdpStorySection";
import PdpTrustSection from "@/components/sections/PdpTrustSection";
import TestimonialSection from "@/components/sections/TestimonialSection";
import type {
  PdpDescriptionViewModel,
  PdpDetailsViewModel,
  PdpFaqViewModel,
  PdpReviewsViewModel,
  PdpStoryViewModel,
  PdpTrustViewModel,
} from "@/lib/sections/viewModels";

afterEach(cleanup);

describe("PdpDescriptionSection", () => {
  it("paints sanitized HTML and layout", () => {
    const model: PdpDescriptionViewModel = {
      key: "d",
      type: "pdp_description",
      title: "Description",
      html: "<p><strong>Soft</strong></p>",
      layout: "wide",
    };
    const { container } = render(<PdpDescriptionSection model={model} />);
    const section = container.querySelector(".sf-pdp-description") as HTMLElement;
    expect(section.getAttribute("data-layout")).toBe("wide");
    expect(screen.getByText("Soft")).not.toBeNull();
  });

  it("paints catalog text without an HTML sink", () => {
    const model: PdpDescriptionViewModel = {
      key: "d",
      type: "pdp_description",
      text: "Line one\nLine two",
      layout: "prose",
    };
    const { container } = render(<PdpDescriptionSection model={model} />);
    expect(container.querySelector(".sf-pdp-description__body")).toBeNull();
    expect(container.querySelector(".sf-pdp-description__text")?.textContent).toBe(
      "Line one\nLine two",
    );
  });
});

describe("PdpDetailsSection", () => {
  it("paints rows in order and sets the column var", () => {
    const model: PdpDetailsViewModel = {
      key: "det",
      type: "pdp_details",
      title: "Details",
      rows: [
        { label: "Fit", value: "Relaxed" },
        { label: "Care", value: "Wash cold" },
      ],
      columns: 1,
    };
    const { container } = render(<PdpDetailsSection model={model} />);
    const section = container.querySelector(".sf-pdp-details") as HTMLElement;
    expect(section.getAttribute("data-columns")).toBe("1");
    expect(section.style.getPropertyValue("--details-cols")).toBe("1");
    const terms = Array.from(container.querySelectorAll("dt")).map((el) => el.textContent);
    expect(terms).toEqual(["Fit", "Care"]);
  });
});

describe("PdpTrustSection", () => {
  const trust = (over: Partial<PdpTrustViewModel> = {}): PdpTrustViewModel => ({
    key: "t",
    type: "pdp_trust",
    title: "Promise",
    items: [
      { id: "ship", icon: "truck", title: "Shipping", description: "Fast and free" },
    ],
    layout: "grid",
    showIcons: true,
    ...over,
  });

  it("paints typed icons and can hide them", () => {
    const { container, rerender } = render(<PdpTrustSection model={trust()} />);
    expect(container.querySelector("svg")).not.toBeNull();
    expect(screen.getByText("Shipping")).not.toBeNull();

    rerender(<PdpTrustSection model={trust({ showIcons: false })} />);
    expect(container.querySelector("svg")).toBeNull();
  });

  it("reports layout through a data attr", () => {
    const { container } = render(<PdpTrustSection model={trust({ layout: "rows" })} />);
    expect(container.querySelector(".sf-pdp-trust")?.getAttribute("data-layout")).toBe("rows");
  });
});

describe("PdpStorySection", () => {
  it("paints body, media, and CTA in the stamped layout", () => {
    const model: PdpStoryViewModel = {
      key: "s",
      type: "pdp_story",
      title: "Our story",
      html: "<p>Made slowly.</p>",
      media: { src: "/media/story.jpg", alt: "Atelier" },
      ctas: [{ text: "Read more", href: "/about", variant: "primary" }],
      layout: "image-left",
    };
    const { container } = render(<PdpStorySection model={model} />);
    expect(container.querySelector(".sf-pdp-story")?.getAttribute("data-layout")).toBe("image-left");
    const img = container.querySelector(".sf-pdp-story__img") as HTMLImageElement;
    expect(img.getAttribute("src")).toBe("/media/story.jpg");
    expect(screen.getByRole("link", { name: "Read more" }).getAttribute("href")).toBe("/about");
  });
});

describe("PdpFaqSection", () => {
  const faq = (layout: "accordion" | "list"): PdpFaqViewModel => ({
    key: "f",
    type: "pdp_faq",
    title: "Questions",
    items: [{ question: "When?", answer: "Today." }],
    layout,
  });

  it("uses details in accordion mode", () => {
    const { container } = render(<PdpFaqSection model={faq("accordion")} />);
    expect(container.querySelector("details")).not.toBeNull();
    expect(container.querySelector("summary")?.textContent).toBe("When?");
  });

  it("renders plain questions and answers in list mode", () => {
    const { container } = render(<PdpFaqSection model={faq("list")} />);
    expect(container.querySelector("details")).toBeNull();
    expect(screen.getByRole("heading", { name: "When?" })).not.toBeNull();
    expect(screen.getByText("Today.")).not.toBeNull();
  });
});

describe("PdpReviews anchor", () => {
  it("puts id=\"reviews\" on the section when the resolver stamps it", () => {
    const model: PdpReviewsViewModel = {
      key: "r",
      type: "pdp_reviews",
      anchorId: "reviews",
      layout: "grid",
      speed: 60,
      pauseOnHover: true,
      items: [{ id: "t1", quote: "Great", name: "Sam", rating: 5 }],
    };
    const { container } = render(<TestimonialSection model={model} id={model.anchorId} />);
    expect(container.querySelector("#reviews")).not.toBeNull();
    expect(screen.getByText("Great")).not.toBeNull();
  });
});
