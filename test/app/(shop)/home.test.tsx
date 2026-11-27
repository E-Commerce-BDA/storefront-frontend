// @vitest-environment jsdom
/**
 * `/` — the CMS-composed home page — sf-060 (plan §6, routing.md §2).
 *
 * There is no home content in the route any more, so the test is about the three
 * faces the route can take and the two rules that make them honest: the page
 * renders whatever the resolver returned, in that order, and every degraded face
 * still offers a real route instead of a scaffold.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const harness = vi.hoisted(() => ({
  sections: null as { sections: unknown[]; version: number } | null,
  models: [] as unknown[],
  clientOptions: [] as Array<{ previewToken?: string | null }>,
  requestHeaders: new Headers(),
}));

vi.mock("next/headers", () => ({
  headers: async () => harness.requestHeaders,
}));
vi.mock("@/lib/cms/client", () => ({
  cmsBaseUrl: () => "http://cms.test",
  createCmsClient: (options?: { previewToken?: string | null }) => {
    // fetchThemeSettings() also builds a client; only the section read carries a
    // preview decision, so ignore optionless calls.
    if (options !== undefined && "previewToken" in options) harness.clientOptions.push(options);
    return {
      getSections: async () => ({
        data: harness.sections,
        status: harness.sections === null ? 503 : 200,
        code: null,
      }),
    };
  },
}));
vi.mock("@/lib/sections/resolveSections", async () => {
  const actual = await import("@/lib/sections/resolveSections");
  return {
    ...actual,
    resolveSectionsWithDiagnostics: async () => ({ models: harness.models, skipped: [] }),
  };
});
vi.mock("@/components/sections/ProductGridIsland", () => ({
  default: () => <div data-testid="grid-island" />,
}));

import * as homeRoute from "@/app/(shop)/page";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

const emptySearchParams = Promise.resolve({});

afterEach(() => {
  cleanup();
  harness.sections = { sections: [], version: 1 };
  harness.models = [];
  harness.clientOptions = [];
  harness.requestHeaders = new Headers();
});

const heroModel = {
  key: "hero-home",
  type: "hero",
  height: "auto",
  slides: [{ id: "s1", headline: "Winter drop", ctas: [] }],
};

describe("home page", () => {
  it("revalidates on a ceiling, not a poll", () => {
    expect(homeRoute.revalidate).toBe(300);
  });

  it("declares a description, canonical and Open Graph face for sharing", () => {
    const meta = homeRoute.metadata;
    expect(meta.description).toBe(SITE_DESCRIPTION);
    expect(meta.alternates?.canonical).toBe("/");
    expect(meta.openGraph).toMatchObject({
      type: "website",
      title: "foreafcbeta — everything for every day",
      description: SITE_DESCRIPTION,
      url: "/",
      siteName: SITE_NAME,
      locale: "en_US",
    });
  });

  it("renders one escaped WebSite JSON-LD script alongside the sections", async () => {
    harness.sections = { sections: [heroModel], version: 2 };
    harness.models = [heroModel];
    const { container } = render(await homeRoute.default({ searchParams: emptySearchParams }));
    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts).toHaveLength(1);
    const html = scripts[0]!.innerHTML;
    expect(html).not.toContain("<");
    expect(JSON.parse(html)).toMatchObject({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
    });
  });

  it("renders the resolved sections, not a hard-coded face", async () => {
    harness.sections = { sections: [heroModel], version: 2 };
    harness.models = [heroModel];
    render(await homeRoute.default({ searchParams: emptySearchParams }));
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Winter drop");
    expect(screen.queryByText(/content service is not/i)).toBeNull();
  });

  it("says the content service is unreachable and still links to the catalog", async () => {
    harness.sections = null;
    render(await homeRoute.default({ searchParams: emptySearchParams }));
    expect(screen.getByText(/content service is not/i)).toBeDefined();
    const link = screen.getByRole("link", { name: "Browse products" }) as HTMLAnchorElement;
    expect(link.getAttribute("href")).toBe("/products");
    // No scaffold hero, no invented strip: the degraded face is the whole page.
    expect(document.querySelector(".sf-hero")).toBeNull();
    expect(document.querySelectorAll(".sf-section")).toHaveLength(1);
  });

  it("says nothing is published when the CMS answered with an empty page", async () => {
    harness.sections = { sections: [], version: 1 };
    harness.models = [];
    render(await homeRoute.default({ searchParams: emptySearchParams }));
    expect(screen.getByText(/Nothing is published/i)).toBeDefined();
    expect(screen.getByRole("link", { name: "Browse products" })).toBeDefined();
  });

  it("treats an all-skipped page the same as an empty one", async () => {
    harness.sections = { sections: [{ key: "x" }], version: 3 };
    harness.models = []; // every section was inactive, empty, or its service was down
    render(await homeRoute.default({ searchParams: emptySearchParams }));
    expect(screen.getByText(/Nothing is published/i)).toBeDefined();
  });

  it("forwards a preview token to the sections read but never into the DOM", async () => {
    const { container } = render(
      await homeRoute.default({ searchParams: Promise.resolve({ preview: "draft-token" }) }),
    );
    expect(harness.clientOptions[0]?.previewToken).toBe("draft-token");
    expect(container.querySelector("[data-preview-draft-bridge]")).not.toBeNull();
    expect(container.innerHTML).not.toContain("draft-token");

    harness.requestHeaders = new Headers({ "x-preview-token": "header-token" });
    await homeRoute.default({ searchParams: emptySearchParams });
    expect(harness.clientOptions.at(-1)?.previewToken).toBe("header-token");
  });
});
