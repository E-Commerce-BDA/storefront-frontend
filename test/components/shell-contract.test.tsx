// @vitest-environment jsdom
/**
 * Shell contract — sf-079.
 *
 * One breadcrumb implementation, one gutter owner, one title scale. These are
 * layout regressions that a component test alone cannot see: the duplicate
 * crumb markup used to live in PageHeader while Breadcrumbs rendered the same
 * thing on CMS routes, and the chrome used to sit inside the padded page
 * container so the bars were inset twice.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import PageHeader from "@/components/shell/PageHeader";
import Breadcrumbs from "@/components/shell/Breadcrumbs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const source = (path: string) => readFileSync(join(root, path), "utf8");

const trail = [
  { label: "Home", href: "/" },
  { label: "Journal", href: "/blog" },
  { label: "Running X" },
];

afterEach(cleanup);

describe("shell contract", () => {
  it("renders the same breadcrumb nav from PageHeader and standalone Breadcrumbs", () => {
    const viaHeader = render(<PageHeader title="Running X" breadcrumb={trail} />);
    const headerNav = viaHeader.container.querySelector("nav[aria-label='Breadcrumb']");
    viaHeader.unmount();
    const standalone = render(<Breadcrumbs items={trail} />);
    const standaloneNav = standalone.container.querySelector("nav[aria-label='Breadcrumb']");

    expect(headerNav).not.toBeNull();
    expect(standaloneNav).not.toBeNull();
    expect(headerNav?.outerHTML).toBe(standaloneNav?.outerHTML);
  });

  it("keeps PageHeader free of a second crumb implementation", () => {
    const pageHeader = source("components/shell/PageHeader.tsx");
    expect(pageHeader).toMatch(/<Breadcrumbs /);
    expect(pageHeader).not.toMatch(/sf-page-header__crumb-list/);
  });

  it("puts the shop chrome outside the padded page container", () => {
    const layout = source("app/(shop)/layout.tsx");
    const order = [
      layout.indexOf("<NavbarMount"),
      layout.indexOf('<div className="sf-shop">'),
      layout.indexOf("<FooterMount"),
    ];
    expect(order[0]).toBeLessThan(order[1]);
    expect(order[1]).toBeLessThan(order[2]);
    expect(layout).toContain("</div>\n          <FooterMount");
  });

  it("does not reserve phantom chrome height on auth routes", () => {
    const auth = source("app/(auth)/layout.tsx").replace(/\/\*[\s\S]*?\*\//g, "");
    expect(auth).not.toMatch(/sf-shop|min-h-\[calc/);
  });

  it("caps no page or footer width and owns the title scale in one place", () => {
    const css = source("app/globals.css").replace(/\/\*[\s\S]*?\*\//g, "");
    expect(css).toMatch(/\.sf-footer__inner\s*\{[^}]*max-width:\s*var\(--footer-measure,\s*none\)/);
    expect(css).toMatch(/\.sf-title\s*\{[^}]*font-size:\s*var\(--fs-display-3\)/);
    expect(css).toMatch(/\.sf-page-header__title\s*\{[^}]*font-size:\s*var\(--page-header-title-size,\s*var\(--fs-display-3\)\)/);
    expect(css).toMatch(/\.sf-pdp__title\s*\{[^}]*var\(--fs-display-3\)/);
  });
});
