// @vitest-environment jsdom
/**
 * Footer + FooterMount — sf-062
 * (plan §7; `components/shell-cart.md` §5)
 *
 * Two things are pinned here that a screenshot cannot: the CMS document renders
 * *as data* (every row comes from the footer, nothing is authored in JSX), and
 * the outage face is honest — real routes only, no invented columns.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { cleanup, render, screen } from "@testing-library/react";
import Footer, { FALLBACK_FOOTER_LINKS } from "@/components/shell/Footer";
import FooterMount from "@/app/_components/FooterMount";
import type { Footer as FooterDocument } from "@ecom/contracts";

/** Root layout source, for the wiring guards at the bottom of this file. The
 *  layout itself is not rendered here: `next/font` and `globals.css` belong to
 *  the bundler, and a component test that mocks around both proves less than the
 *  two lines of DOM order it would take to check them directly. */
const here = dirname(fileURLToPath(import.meta.url));
const layoutSource = readFileSync(join(here, "..", "..", "app", "layout.tsx"), "utf8");

const CMS_FOOTER: FooterDocument = {
  columns: [
    {
      title: "Shop",
      links: [
        { label: "All products", href: "/products" },
        { label: "Help centre", href: "https://help.foreafcbeta.test" },
      ],
    },
    { title: "Company", links: [{ label: "About us", href: "/about" }] },
  ],
  social: [
    { platform: "instagram", label: "Instagram", url: "https://instagram.com/foreafcbeta" },
    { platform: "youtube", label: "YouTube", url: "https://youtube.com/@foreafcbeta" },
  ],
  legal: [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
  ],
  contact: { email: "help@foreafcbeta.test", phone: "+91 90000 00000", address: "Surat, Gujarat" },
  logo: "/media/seed/footer/logo.svg",
  wordmark: "Next.7",
  tagline: "Everything for every day.",
  copyright: "© 2026 Next.7. All rights reserved.",
  paymentIcons: ["visa", "mastercard", "gpay"],
};

let mockPath = "/";
vi.mock("next/navigation", () => ({
  usePathname: () => mockPath,
}));

afterEach(cleanup);
beforeEach(() => {
  mockPath = "/";
});

describe("Footer — the CMS face", () => {
  it("renders the document it was given, and nothing it was not", () => {
    const { container } = render(<Footer footer={CMS_FOOTER} />);

    expect(container.querySelector('[data-face="cms"]')).not.toBeNull();
    expect(screen.getByRole("navigation", { name: "Shop" })).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Company" })).not.toBeNull();
    expect(screen.getByText("Everything for every day.")).not.toBeNull();
    expect(screen.getByText("© 2026 Next.7. All rights reserved.")).not.toBeNull();
    // Column titles are the admin's words, not a heading hierarchy claim.
    expect(container.querySelectorAll(".sf-footer__col")).toHaveLength(2);
    expect(container.querySelectorAll(".sf-footer__pay")).toHaveLength(3);
    // Payments are one horizontal row in the bottom bar, sharing it with the
    // copyright (which anchors the left), and a known key is a real mark.
    const payments = container.querySelector(".sf-footer__payments");
    expect(payments?.closest(".sf-footer__legal")).not.toBeNull();
    expect(payments?.parentElement?.querySelector(".sf-footer__copyright")).not.toBeNull();
    // The legal links moved up into the meta row, on the address line.
    expect(
      container.querySelector(".sf-footer__legal-nav")?.closest(".sf-footer__meta"),
    ).not.toBeNull();
    expect(
      container.querySelector('.sf-footer__pay[data-icon="visa"] img')?.getAttribute("src"),
    ).toBe("/media/pay/visa.svg");
    // No invented rows: the footer has six columns of data or zero extra ones.
    expect(container.querySelectorAll(".sf-footer__col-title")).toHaveLength(2);
  });

  it("treats an absolute href as external and denies the target window access", () => {
    render(<Footer footer={CMS_FOOTER} />);
    const external = screen.getByRole("link", { name: "Help centre" }) as HTMLAnchorElement;

    expect(external.getAttribute("href")).toBe("https://help.foreafcbeta.test");
    expect(external.getAttribute("target")).toBe("_blank");
    expect(external.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("leaves an internal href plain", () => {
    render(<Footer footer={CMS_FOOTER} />);
    const internal = screen.getByRole("link", { name: "All products" }) as HTMLAnchorElement;

    expect(internal.getAttribute("href")).toBe("/products");
    expect(internal.getAttribute("target")).toBeNull();
    expect(internal.getAttribute("rel")).toBeNull();
  });

  it("links the contact rows as schemes and keeps the address as text", () => {
    const { container } = render(<Footer footer={CMS_FOOTER} />);

    const email = screen.getByRole("link", { name: "help@foreafcbeta.test" }) as HTMLAnchorElement;
    expect(email.getAttribute("href")).toBe("mailto:help@foreafcbeta.test");
    const phone = screen.getByRole("link", { name: "+91 90000 00000" }) as HTMLAnchorElement;
    expect(phone.getAttribute("href")).toBe("tel:+919000000000");
    expect(container.querySelector("address.sf-footer__contact span")?.textContent).toBe(
      "Surat, Gujarat",
    );
  });

  it("carries platform as state, not as a fake glyph", () => {
    const { container } = render(<Footer footer={CMS_FOOTER} />);
    const rows = container.querySelectorAll(".sf-footer__social li");

    expect(Array.from(rows).map((row) => row.getAttribute("data-platform"))).toEqual([
      "instagram",
      "youtube",
    ]);
    expect(rows[0].textContent).toBe("Instagram");
  });

  it("falls back to the label for an unknown payment key", () => {
    const { container } = render(<Footer footer={{ paymentIcons: ["amex"] }} />);
    const chip = container.querySelector('.sf-footer__pay[data-icon="amex"]');
    expect(chip?.querySelector("img")).toBeNull();
    expect(chip?.textContent).toBe("amex");
  });

  it("renders an empty document as a shell, not a crash", () => {
    const { container } = render(<Footer footer={{}} />);

    expect(container.querySelector('[data-face="cms"]')).not.toBeNull();
    expect(container.querySelector(".sf-footer__columns")).toBeNull();
    expect(container.querySelector(".sf-footer__social")).toBeNull();
    expect(container.querySelector(".sf-footer__legal-nav")).toBeNull();
    // The wordmark is the only thing always worth showing, and it has a real name.
    expect(container.querySelector(".sf-footer__wordmark")?.textContent).toBe("Next.7");
  });

  it("omits an absent logo rather than a broken image", () => {
    const withLogo = render(<Footer footer={CMS_FOOTER} />);
    expect(withLogo.container.querySelector("img.sf-footer__logo")).not.toBeNull();
    withLogo.unmount();

    const without = render(<Footer footer={{ wordmark: "plain" }} />);
    expect(without.container.querySelector("img")).toBeNull();
  });
});

describe("Footer — the minimal (CMS-down) face", () => {
  it("shows only routes that exist", () => {
    const { container } = render(<Footer footer={null} />);

    expect(container.querySelector('[data-face="minimal"]')).not.toBeNull();
    const links = Array.from(
      container.querySelectorAll<HTMLAnchorElement>(".sf-footer__fallback a"),
    ).map((a) => a.getAttribute("href"));
    expect(links).toEqual(["/products", "/about", "/privacy", "/terms"]);
    expect(links).toEqual(FALLBACK_FOOTER_LINKS.map((link) => link.href));
    // Nothing invented: no columns, no contact, no copyright the code made up.
    expect(container.querySelector(".sf-footer__columns")).toBeNull();
    expect(container.querySelector(".sf-footer__contact")).toBeNull();
    expect(container.querySelector(".sf-footer__copyright")).toBeNull();
  });

  it("is exported as data so the route list can be checked against the app", () => {
    expect(FALLBACK_FOOTER_LINKS.every((link) => link.href.startsWith("/"))).toBe(true);
  });
});

describe("FooterMount", () => {
  it("mounts the resolved document on shop routes", () => {
    const { container } = render(<FooterMount footer={CMS_FOOTER} />);
    expect(container.querySelector('[data-face="cms"]')).not.toBeNull();
  });

  it("mounts the minimal face when the server resolved nothing", () => {
    const { container } = render(<FooterMount footer={null} />);
    expect(container.querySelector('[data-face="minimal"]')).not.toBeNull();
  });

  it("renders on auth paths, keeping global chrome", () => {
    for (const path of ["/signin", "/signup", "/forgot", "/forgot/reset"]) {
      mockPath = path;
      const { container } = render(<FooterMount footer={CMS_FOOTER} />);
      expect(container.firstChild, path).not.toBeNull();
      cleanup();
    }
  });

  it("does not suppress a shop path that merely starts with an auth-looking word", () => {
    mockPath = "/products/signin-promo";
    const { container } = render(<FooterMount footer={CMS_FOOTER} />);
    expect(container.querySelector('[data-face="cms"]')).not.toBeNull();
  });
});

describe("root layout wiring (plan §7)", () => {
  it("resolves the footer server-side and hands the document down as a prop", () => {
    expect(layoutSource).toMatch(/import \{ fetchFooter \} from "@\/lib\/cms\/footer";/);
    expect(layoutSource).toMatch(/fetchFooter\(\)/);
    expect(layoutSource).toMatch(/<FooterMount footer=\{footerResult\.footer\} \/>/);
  });

  it("mounts the footer after the page, not beside the navbar", () => {
    // Plan §7 said "directly after NavbarMount" meaning the layout owns it;
    // DOM order is the footer's actual job. A footer above {children} is a bug
    // this line is the cheapest possible guard against.
    const children = layoutSource.indexOf("{children}");
    const navbar = layoutSource.indexOf("<NavbarMount");
    const footer = layoutSource.indexOf("<FooterMount");
    expect(children).toBeGreaterThan(-1);
    expect(navbar).toBeGreaterThan(-1);
    expect(footer).toBeGreaterThan(children);
  });

  it("never leaves the layout able to reject on a CMS outage", () => {
    // fetchNavSettings and fetchFooter are both total: `fetchFooter` catches its
    // source and its cache, so no `catch` belongs here and a throw would blank
    // every route. Asserted as the absence of an error path instead of a mock.
    const footerModule = readFileSync(join(here, "..", "..", "lib", "cms", "footer.ts"), "utf8");
    expect(footerModule).toMatch(/return \{ footer: null, stale: false, fallback: true \};/);
    expect(layoutSource).not.toMatch(/catch/);
  });
});
