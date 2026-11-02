// @vitest-environment jsdom
/**
 * `components/pages/PageBlocks.tsx` — sf-063.
 *
 * The legal/about renderer, and the one thing that must be proven here rather
 * than trusted: a `rich_text` block reaches the DOM *sanitized*. This is the
 * app's only `dangerouslySetInnerHTML` for admin HTML, so a payload that survives
 * the allowlist would be a real XSS — the test asserts the payload does not land.
 */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { PageBlock } from "@ecom/contracts";
import PageBlocks from "@/components/pages/PageBlocks";

afterEach(cleanup);

function renderBlocks(blocks: PageBlock[]) {
  const { container } = render(<PageBlocks blocks={blocks} />);
  return container.querySelector(".sf-page__blocks") as HTMLElement;
}

describe("PageBlocks — rich_text", () => {
  it("renders allowlisted markup through the sanitizer", () => {
    const root = renderBlocks([
      { type: "rich_text", id: "r", body: "<h2>Heading</h2><p>Body <strong>bold</strong></p>" },
    ]);
    const prose = root.querySelector(".sf-prose") as HTMLElement;
    expect(prose.querySelector("h2")?.textContent).toBe("Heading");
    expect(prose.querySelector("strong")?.textContent).toBe("bold");
  });

  it("drops a script and its body — the payload never reaches the DOM", () => {
    const root = renderBlocks([
      { type: "rich_text", id: "r", body: "<p>safe</p><script>alert(1)</script>" },
    ]);
    expect(root.querySelector("script")).toBeNull();
    expect(root.querySelector(".sf-prose p")?.textContent).toBe("safe");
    expect(root.innerHTML).not.toContain("alert");
  });

  it("strips an inline handler and keeps only the allowed tag", () => {
    const root = renderBlocks([
      { type: "rich_text", id: "r", body: '<p onclick="steal()">Text</p>' },
    ]);
    const p = root.querySelector(".sf-prose p") as HTMLElement;
    expect(p.getAttribute("onclick")).toBeNull();
    expect(p.textContent).toBe("Text");
  });

  it("renders nothing for a blank body instead of an empty prose div", () => {
    const root = renderBlocks([{ type: "rich_text", id: "r", body: "   " }]);
    expect(root.querySelector(".sf-prose")).toBeNull();
  });
});

describe("PageBlocks — image", () => {
  it("is a figure with a caption slot and a lazy image", () => {
    const root = renderBlocks([
      { type: "image", id: "i", url: "/media/banner.jpg", alt: "Team", caption: "Us in 2020" },
    ]);
    const img = root.querySelector("img") as HTMLImageElement;
    expect(img.getAttribute("alt")).toBe("Team");
    expect(img.getAttribute("loading")).toBe("lazy");
    expect(root.querySelector("figcaption")?.textContent).toBe("Us in 2020");
  });

  it("omits the figcaption when there is no caption", () => {
    const root = renderBlocks([{ type: "image", id: "i", url: "/x.jpg" }]);
    expect(root.querySelector("figcaption")).toBeNull();
    expect(root.querySelector("img")?.getAttribute("alt")).toBe("");
  });
});

describe("PageBlocks — cta", () => {
  it("paints the buttons through Button, first one primary", () => {
    const root = renderBlocks([
      {
        type: "cta",
        id: "c",
        title: "Ready?",
        ctas: [
          { id: "a", text: "Shop now", link: "/products" },
          { id: "b", text: "Read the journal", link: "/blog" },
        ],
      },
    ]);
    expect(root.querySelector(".sf-page__cta-title")?.textContent).toBe("Ready?");
    const buttons = root.querySelectorAll<HTMLAnchorElement>(".sf-page__cta-row a.sf-btn");
    expect(buttons).toHaveLength(2);
    expect(buttons[0].getAttribute("href")).toBe("/products");
    expect(buttons[0].textContent).toBe("Shop now");
    expect(buttons[1].getAttribute("href")).toBe("/blog");
  });

  it("omits the row when the block carries no ctas", () => {
    const root = renderBlocks([{ type: "cta", id: "c", title: "Note", ctas: [] }]);
    expect(root.querySelector(".sf-page__cta-row")).toBeNull();
    expect(root.querySelector(".sf-page__cta-title")?.textContent).toBe("Note");
  });
});

describe("PageBlocks — faq", () => {
  it("renders each item as a closed disclosure with question and answer", () => {
    const root = renderBlocks([
      {
        type: "faq",
        id: "f",
        items: [
          { question: "Do you ship?", answer: "Yes, nationwide." },
          { question: "Returns?", answer: "30 days." },
        ],
      },
    ]);
    const items = root.querySelectorAll("details.sf-faq__item");
    expect(items).toHaveLength(2);
    expect(items[0].hasAttribute("open")).toBe(false);
    expect(root.querySelectorAll("summary.sf-faq__q")[0].textContent).toBe("Do you ship?");
    expect(root.querySelectorAll(".sf-faq__a")[0].textContent).toBe("Yes, nationwide.");
  });

  it("keeps a question readable by role", () => {
    renderBlocks([{ type: "faq", id: "f", items: [{ question: "Q one", answer: "A one" }] }]);
    expect(screen.getByText("Q one")).toBeDefined();
  });
});

describe("PageBlocks — order and empty", () => {
  it("renders blocks in document order across types", () => {
    const root = renderBlocks([
      { type: "rich_text", id: "r", body: "<p>first</p>" },
      { type: "faq", id: "f", items: [{ question: "q", answer: "a" }] },
    ]);
    const kids = Array.from(root.children);
    expect(kids[0]?.className).toContain("sf-prose");
    expect(kids[1]?.className).toContain("sf-faq");
  });

  it("renders nothing for an empty block list", () => {
    expect(renderBlocks([]).children).toHaveLength(0);
  });
});
