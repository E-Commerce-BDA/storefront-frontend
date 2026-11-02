// @vitest-environment jsdom
/**
 * `/about`, `/privacy`, `/terms` — the CMS legal/company routes — sf-063
 * (plan §7).
 *
 * One route factory, three slugs, no content authored in the route. What is
 * proven here is the promise the plan makes: the page is the CMS document's
 * blocks, `null` is a 404, and the metadata comes from the document's `seo`.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import type { Page } from "@ecom/contracts";

const harness = vi.hoisted(() => ({ page: null as unknown }));

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));
vi.mock("@/lib/cms/loadDocuments", () => ({
  loadPage: async () => harness.page,
  CMS_PAGE_ROUTES: { "/about": "about", "/privacy": "privacy", "/terms": "terms" },
}));

import * as about from "@/app/(shop)/about/page";
import * as privacy from "@/app/(shop)/privacy/page";
import * as terms from "@/app/(shop)/terms/page";

function page(over: Partial<Page> = {}): Page {
  return {
    id: "p1",
    slug: "about",
    title: "About us",
    isActive: true,
    blocks: [
      { type: "rich_text", id: "r", body: "<p>We are a shop.</p>" },
      { type: "faq", id: "f", items: [{ question: "Ship?", answer: "Yes." }] },
    ],
    ...over,
  } as Page;
}

afterEach(() => {
  cleanup();
  harness.page = null;
});

describe("legal/company routes share one renderer", () => {
  it("every route revalidates on the cms:pages ceiling", () => {
    expect(about.revalidate).toBe(300);
    expect(privacy.revalidate).toBe(300);
    expect(terms.revalidate).toBe(300);
  });

  it("renders the document blocks through PageBlocks, one <h1>", async () => {
    harness.page = page();
    const { container } = render(await about.default());
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    expect(container.querySelector(".sf-page__title")?.textContent).toBe("About us");
    expect(container.querySelector(".sf-prose p")?.textContent).toBe("We are a shop.");
    expect(container.querySelector("details.sf-faq__item")).not.toBeNull();
    expect(container.querySelector(".sf-page-header__crumbs a")?.getAttribute("href")).toBe("/");
  });

  it("a null document is notFound, not an error page", async () => {
    harness.page = null;
    const element = await privacy.default();
    // notFound lives in CmsPage, so it fires during render, not during Page().
    expect(() => render(element)).toThrow("NEXT_NOT_FOUND");
  });

  it("the sanitizer runs on rich_text before it hits the DOM", async () => {
    harness.page = page({
      slug: "privacy",
      blocks: [{ type: "rich_text", id: "r", body: "<p>ok</p><script>bad()</script>" }],
    });
    const { container } = render(await terms.default());
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector(".sf-prose p")?.textContent).toBe("ok");
  });
});

describe("generateMetadata reads the document's seo", () => {
  it("prefers seo.title/description and sets the canonical path", async () => {
    harness.page = page({ seo: { title: "Custom", description: "Custom desc" } });
    const meta = await about.generateMetadata();
    expect(meta.title).toBe("Custom");
    expect(meta.description).toBe("Custom desc");
    expect(meta.alternates?.canonical).toBe("/about");
  });

  it("falls back to the route title when the document has no seo", async () => {
    harness.page = page({ seo: undefined });
    const meta = await terms.generateMetadata();
    expect(meta.title).toBe("Terms of sale");
    expect(meta.alternates?.canonical).toBe("/terms");
  });

  it("still titles the tab when the document is null", async () => {
    harness.page = null;
    const meta = await privacy.generateMetadata();
    expect(meta.title).toBe("Privacy policy");
  });
});
