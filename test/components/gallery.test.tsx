// @vitest-environment jsdom
/**
 * Gallery contract — controlled index, thumb rail, arrow keys.
 *
 * The block never decides which image is active; it reports the index it wants
 * and paints whatever it is handed. A stale index must still render (an island
 * can swap the product under it), and a single-image product must not grow a
 * one-thumb rail.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import Gallery from "@/components/commerce/Gallery";
import { GALLERY_DEFAULT_RATIO, ratioCss } from "@/lib/commerce/gallery";

afterEach(cleanup);

const images = [
  { url: "a.jpg", alt: "Ocean Linen Shirt front" },
  { url: "b.jpg", alt: "Ocean Linen Shirt back" },
  { url: "c.jpg", alt: "Ocean Linen Shirt detail" },
];

const main = () => screen.getByRole("img", { name: "Ocean Linen Shirt front" }) as HTMLImageElement;

describe("Gallery", () => {
  it("paints the active frame with its own alt text", () => {
    render(<Gallery images={images} activeIndex={1} onIndexChange={() => {}} />);

    expect(screen.getByRole("img", { name: "Ocean Linen Shirt back" })).not.toBeNull();
  });

  it("loads the first frame eagerly and the rest lazily", () => {
    const { rerender } = render(<Gallery images={images} activeIndex={0} onIndexChange={() => {}} />);
    expect(main().getAttribute("loading")).toBe("eager");

    rerender(<Gallery images={images} activeIndex={2} onIndexChange={() => {}} />);
    expect(screen.getByRole("img", { name: "Ocean Linen Shirt detail" }).getAttribute("loading")).toBe(
      "lazy",
    );
  });

  it("marks the active thumb for both the eye and a screen reader", () => {
    render(<Gallery images={images} activeIndex={1} onIndexChange={() => {}} />);

    const thumbs = screen.getAllByRole("button");
    expect(thumbs).toHaveLength(3);
    expect(thumbs[1].getAttribute("aria-current")).toBe("true");
    expect(thumbs[1].getAttribute("data-active")).toBe("true");
    expect(thumbs[0].getAttribute("aria-current")).toBeNull();
  });

  it("reports the tapped thumb", () => {
    const onIndexChange = vi.fn();
    render(<Gallery images={images} activeIndex={0} onIndexChange={onIndexChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Show image 3" }));
    expect(onIndexChange).toHaveBeenCalledWith(2);
  });

  it("wraps with the arrow keys from a focused thumb", () => {
    const onIndexChange = vi.fn();
    render(<Gallery images={images} activeIndex={2} onIndexChange={onIndexChange} />);

    fireEvent.keyDown(screen.getByRole("button", { name: "Show image 3" }), { key: "ArrowRight" });
    expect(onIndexChange).toHaveBeenLastCalledWith(0);

    fireEvent.keyDown(screen.getByRole("button", { name: "Show image 3" }), { key: "ArrowLeft" });
    expect(onIndexChange).toHaveBeenLastCalledWith(1);
  });

  it("leaves other keys alone", () => {
    const onIndexChange = vi.fn();
    render(<Gallery images={images} activeIndex={0} onIndexChange={onIndexChange} />);

    fireEvent.keyDown(screen.getByRole("button", { name: "Show image 1" }), { key: "Tab" });
    expect(onIndexChange).not.toHaveBeenCalled();
  });

  it("clamps a stale index instead of rendering nothing", () => {
    render(<Gallery images={images} activeIndex={99} onIndexChange={() => {}} />);

    expect(screen.getByRole("img", { name: "Ocean Linen Shirt detail" })).not.toBeNull();
  });

  it("hides the rail when there is one image, and shows a placeholder when there are none", () => {
    const { container, rerender } = render(
      <Gallery images={[images[0]]} activeIndex={0} onIndexChange={() => {}} />,
    );
    expect(screen.queryAllByRole("button")).toHaveLength(0);

    rerender(<Gallery images={[]} activeIndex={0} onIndexChange={() => {}} />);
    expect(container.querySelector(".sf-gallery__placeholder")).not.toBeNull();
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("carries the ratio and fit knobs as data/var", () => {
    const { container, rerender } = render(
      <Gallery images={images} activeIndex={0} onIndexChange={() => {}} />,
    );
    const root = container.querySelector(".sf-gallery") as HTMLElement;

    // Portrait by default, from the one ratio table the card also reads.
    expect(root.style.getPropertyValue("--gallery-ratio")).toBe(ratioCss(GALLERY_DEFAULT_RATIO));
    expect(root.dataset.fit).toBe("cover");

    rerender(<Gallery images={images} activeIndex={0} ratio="1:1" fit="contain" onIndexChange={() => {}} />);
    expect(root.style.getPropertyValue("--gallery-ratio")).toBe(ratioCss("1:1"));
    expect(root.dataset.fit).toBe("contain");
  });
});
