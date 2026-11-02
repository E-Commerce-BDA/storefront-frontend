// @vitest-environment jsdom
/**
 * `/blog` and `/blog/[slug]` — sf-063 (plan §7).
 *
 * The routes own three decisions and no content: which service read to make,
 * which face a `null` becomes, and the ISR ceiling. All are asserted here with
 * `lib/cms/loadDocuments` mocked, so the fixtures are the parsed contract rows the
 * real client would hand back, not HTTP envelopes.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { Blog } from "@ecom/contracts";

const harness = vi.hoisted(() => ({
  list: null as { blogs: unknown[]; nextCursor: string | null } | null,
  detail: null as unknown,
}));

// `notFound` throws the sentinel Next uses; the detail route's 404 path is
// asserted by that throw rather than by spying on a read-only ESM binding.
const nav = vi.hoisted(() => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));
vi.mock("next/navigation", () => nav);

vi.mock("@/lib/cms/loadDocuments", () => ({
  loadPublishedBlogs: async () => harness.list,
  loadBlog: async () => harness.detail,
  blogStaticParams: async () => [],
}));

import * as blogList from "@/app/(shop)/blog/page";
import * as blogDetail from "@/app/(shop)/blog/[slug]/page";

function blog(over: Partial<Blog> = {}): Blog {
  return {
    id: "b1",
    slug: "field-notes",
    title: "Field notes",
    content: [{ type: "paragraph", id: "p1", text: "hello" }],
    categoryId: "c1",
    status: "published",
    publishedAt: "2026-11-04T00:00:00.000Z",
    ...over,
  } as Blog;
}

afterEach(() => {
  cleanup();
  harness.list = { blogs: [], nextCursor: null };
  harness.detail = null;
});

describe("/blog — the list route", () => {
  it("revalidates on the cms:blogs ceiling", () => {
    expect(blogList.revalidate).toBe(300);
  });

  it("renders published cards from the loader", async () => {
    harness.list = { blogs: [blog({ slug: "a", title: "Post A" }), blog({ slug: "b", title: "Post B" })], nextCursor: null };
    render(await blogList.default());
    expect(screen.getByRole("link", { name: /Post A/ })).toBeDefined();
    expect((screen.getByRole("link", { name: /Post B/ }) as HTMLAnchorElement).getAttribute("href")).toBe(
      "/blog/b",
    );
  });

  it("shows the outage face — not an empty list — when the loader returns null", async () => {
    harness.list = null;
    render(await blogList.default());
    expect(screen.getByText(/temporarily unavailable/i)).toBeDefined();
  });

  it("shows the 'nothing published' face for a real empty list", async () => {
    harness.list = { blogs: [], nextCursor: null };
    render(await blogList.default());
    expect(screen.getByText(/Nothing published yet/i)).toBeDefined();
    expect(screen.queryByText(/temporarily unavailable/i)).toBeNull();
  });
});

describe("/blog/[slug] — the detail route", () => {
  it("revalidates on the same ceiling", () => {
    expect(blogDetail.revalidate).toBe(300);
  });

  it("renders the article from the document, one <h1>", async () => {
    harness.detail = blog({ title: "A real post", author: "Dana", excerpt: "Stand first" });
    render(await blogDetail.default({ params: Promise.resolve({ slug: "field-notes" }) }));

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("A real post");
    expect(document.querySelectorAll("h1")).toHaveLength(1);
    expect(screen.getByText("Dana")).toBeDefined();
    expect(screen.getByText(/November 4, 2026/)).toBeDefined();
    expect(document.querySelector(".sf-post__blocks p")?.textContent).toBe("hello");
  });

  it("emits BlogPosting JSON-LD built from the document", async () => {
    harness.detail = blog({ publishedAt: "2026-11-04T00:00:00.000Z" });
    const { container } = render(
      await blogDetail.default({ params: Promise.resolve({ slug: "field-notes" }) }),
    );
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    const json = JSON.parse(script?.textContent ?? "{}");
    expect(json["@type"]).toBe("BlogPosting");
    expect(json.datePublished).toBe("2026-11-04T00:00:00.000Z");
  });

  it("calls notFound when the document is null (unpublished, missing, or outage)", async () => {
    harness.detail = null;
    await expect(
      blogDetail.default({ params: Promise.resolve({ slug: "ghost" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("generateMetadata falls back to the post title when seo is absent", async () => {
    harness.detail = blog({ title: "Meta title" });
    const meta = await blogDetail.generateMetadata({ params: Promise.resolve({ slug: "field-notes" }) });
    expect(meta.title).toBe("Meta title");
    expect(meta.alternates?.canonical).toBe("/blog/field-notes");
  });
});
