// @vitest-environment jsdom
/**
 * `components/blog/PostBlocks.tsx` — sf-063.
 *
 * The four block types and the two rules a screenshot misses: a `level: 1`
 * heading is demoted to `<h2>` (the article owns the `<h1>`), and a paragraph is
 * plain text — no HTML sink for post prose.
 */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import type { BlogBlock } from "@ecom/contracts";
import PostBlocks from "@/components/blog/PostBlocks";

afterEach(cleanup);

function renderBlocks(blocks: BlogBlock[]) {
  const { container } = render(<PostBlocks blocks={blocks} />);
  return container.querySelector(".sf-post__blocks") as HTMLElement;
}

describe("PostBlocks", () => {
  it("paints blocks in document order", () => {
    const root = renderBlocks([
      { type: "heading", id: "h", text: "One", level: 2 },
      { type: "paragraph", id: "p", text: "Body" },
    ]);
    const kids = Array.from(root.children);
    expect(kids[0]?.tagName).toBe("H2");
    expect(kids[1]?.tagName).toBe("P");
  });

  it("demotes a level-1 heading to <h2> — the article owns the single <h1>", () => {
    const root = renderBlocks([{ type: "heading", id: "h", text: "Top", level: 1 }]);
    expect(root.querySelector("h1")).toBeNull();
    expect(root.querySelector("h2")?.textContent).toBe("Top");
  });

  it("maps levels 3 and 4 to their own tags", () => {
    expect(renderBlocks([{ type: "heading", id: "h", text: "T", level: 3 }]).querySelector("h3")).not.toBeNull();
    expect(renderBlocks([{ type: "heading", id: "h", text: "T", level: 4 }]).querySelector("h4")).not.toBeNull();
  });

  it("renders an image with the caption as the alt fallback and a figcaption", () => {
    const root = renderBlocks([
      { type: "image", id: "i", url: "/media/x.jpg", caption: "A caption" },
    ]);
    const img = root.querySelector("img") as HTMLImageElement;
    expect(img.getAttribute("src")).toBe("/media/x.jpg");
    expect(img.getAttribute("alt")).toBe("A caption");
    expect(img.getAttribute("loading")).toBe("lazy");
    expect(root.querySelector("figcaption")?.textContent).toBe("A caption");
  });

  it("uses an explicit alt over the caption, and an empty alt when neither exists", () => {
    const withAlt = renderBlocks([
      { type: "image", id: "i", url: "/x.jpg", alt: "Described", caption: "Cap" },
    ]);
    expect(withAlt.querySelector("img")?.getAttribute("alt")).toBe("Described");

    const bare = renderBlocks([{ type: "image", id: "i", url: "/x.jpg" }]);
    expect(bare.querySelector("img")?.getAttribute("alt")).toBe("");
    expect(bare.querySelector("figcaption")).toBeNull();
  });

  it("renders a quote with a cite only when one is present", () => {
    const cited = renderBlocks([{ type: "quote", id: "q", quote: "Wow", cite: "Someone" }]);
    expect(cited.querySelector("blockquote cite")?.textContent).toBe("Someone");

    const plain = renderBlocks([{ type: "quote", id: "q", quote: "Wow" }]);
    expect(plain.querySelector("cite")).toBeNull();
    expect(plain.querySelector("blockquote p")?.textContent).toBe("Wow");
  });

  it("keeps paragraph text as text — never an HTML sink", () => {
    const root = renderBlocks([
      { type: "paragraph", id: "p", text: "<script>alert(1)</script> plain" },
    ]);
    expect(root.querySelector("script")).toBeNull();
    expect(root.querySelector("p")?.textContent).toBe("<script>alert(1)</script> plain");
  });

  it("renders nothing for an empty body", () => {
    expect(renderBlocks([]).children).toHaveLength(0);
  });
});
