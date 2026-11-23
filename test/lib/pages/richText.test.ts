/**
 * `lib/pages/richText.ts` — the allowlist is the security boundary, so this file
 * is written as an attack list, not a formatting list (sf-063).
 *
 * Everything asserted here is a property the page routes depend on: an admin's
 * `rich_text` block reaches the DOM through `dangerouslySetInnerHTML`, and the
 * only thing between those two facts and an XSS is this scanner.
 */
import { describe, expect, it } from "vitest";
import { isInternalHref, richTextHtml, sanitizeRichText } from "@/lib/pages/richText";

describe("allowlist", () => {
  it("passes the allowed vocabulary through untouched", () => {
    const input =
      "<p>Hello <strong>world</strong> and <em>others</em><br></p>" +
      "<h2>One</h2><h3>Two</h3><h4>Three</h4>" +
      "<ul><li>a</li></ul><ol><li>b</li></ol>";
    expect(sanitizeRichText(input).html).toBe(input);
  });

  it("drops every attribute, including on an allowed tag", () => {
    const { html, stripped } = sanitizeRichText(
      '<p class="lead" onclick="steal()">Hi</p>',
    );
    expect(html).toBe("<p>Hi</p>");
    expect(stripped).toBeGreaterThan(0);
  });

  it("unwraps an unknown tag but keeps its prose", () => {
    expect(sanitizeRichText("<div>Still readable</div>").html).toBe("Still readable");
  });

  it("removes comments", () => {
    expect(sanitizeRichText("<p>a<!-- internal note -->b</p>").html).toBe("<p>ab</p>");
  });

  it("closes what the admin left open, and ignores a closer with no opener", () => {
    expect(sanitizeRichText("<p>one").html).toBe("<p>one</p>");
    expect(sanitizeRichText("</p>only a closer").html).toBe("only a closer");
    expect(sanitizeRichText("<ul><li>a</ul>").html).toBe("<ul><li>a</li></ul>");
  });
});

describe("script execution vectors", () => {
  it("drops a script element together with its body", () => {
    expect(sanitizeRichText("<script>alert(1)</script>").html).toBe("");
    expect(sanitizeRichText("<p>before</p><script>evil()</script><p>after</p>").html).toBe(
      "<p>before</p><p>after</p>",
    );
  });

  it("drops style/textarea/title bodies for the same reason", () => {
    expect(sanitizeRichText("<style>body{display:none}</style>").html).toBe("");
    expect(sanitizeRichText("<title>tab hijack</title>").html).toBe("");
  });

  it("survives the classic attribute payloads without emitting them", () => {
    const vectors = [
      '<img src=x onerror="alert(1)">',
      '<svg onload="alert(1)"></svg>',
      '<p onmouseover="alert(1)">hover me</p>',
      '<iframe src="https://evil.test"></iframe>',
      '<body onload="alert(1)">',
    ];
    for (const vector of vectors) {
      const html = sanitizeRichText(vector).html;
      expect(html, vector).not.toMatch(/onerror|onload|onmouseover|iframe|src=/i);
      expect(html, vector).not.toContain("<img");
      expect(html, vector).not.toContain("<svg");
      expect(html, vector).not.toContain("<iframe");
      expect(html, vector).not.toContain("<body");
    }
  });

  it("treats a bare or mangled `<` as text, never as a tag", () => {
    expect(sanitizeRichText("5 < 6").html).toBe("5 &lt; 6");
    expect(sanitizeRichText("<p").html).toBe("&lt;p");
    expect(sanitizeRichText("<>not a tag<>").html).toBe("&lt;&gt;not a tag&lt;&gt;");
  });

  it("escapes markup in text so it cannot restructure the page", () => {
    expect(sanitizeRichText("<p>a &lt; b &amp; c</p>").html).toBe("<p>a &lt; b &amp; c</p>");
    expect(sanitizeRichText("Tom & Jerry").html).toBe("Tom &amp; Jerry");
    expect(sanitizeRichText("<p>&copy; 2026</p>").html).toBe("<p>&copy; 2026</p>");
  });
});

describe("links", () => {
  it("keeps an internal anchor and its href only", () => {
    const html = sanitizeRichText('<a href="/privacy" target="_blank" rel="x">Policy</a>').html;
    expect(html).toBe('<a href="/privacy">Policy</a>');
  });

  it("unwraps every href that is not an internal path", () => {
    const hrefs = [
      "javascript:alert(1)",
      "JaVaScRiPt:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "https://evil.test/phish",
      "//evil.test",
      "/\\evil.test",
      "mailto:x@x.test",
      "",
      "   ",
    ];
    for (const href of hrefs) {
      const html = sanitizeRichText(`<a href="${href}">Label</a>`).html;
      expect(html, href).not.toContain("<a");
      expect(html).toContain("Label"); // the words are still the admin's, the jump is not
    }
  });

  it("quotes the href it keeps, so a `<` cannot escape the attribute", () => {
    expect(sanitizeRichText('<a href="/a<b">x</a>').html).toBe('<a href="/a&lt;b">x</a>');
  });

  it("recognises internal paths in isolation", () => {
    expect(isInternalHref("/")).toBe(true);
    expect(isInternalHref("/blog/field-notes")).toBe(true);
    expect(isInternalHref("//example.com")).toBe(false);
    expect(isInternalHref("/../secret")).toBe(true); // a path is a path — the server decides
    expect(isInternalHref(" /about ")).toBe(true);
  });
});

describe("the renderer's contract", () => {
  it("renders nothing for blank input instead of an empty paragraph", () => {
    expect(richTextHtml("")).toBe("");
    expect(richTextHtml("   \n  ")).toBe("");
  });

  it("never throws, whatever the document contains", () => {
    const junk = [
      undefined as unknown as string,
      null as unknown as string,
      "<".repeat(500),
      "></<p/".repeat(100),
      "<a href=>x</a>",
    ];
    for (const value of junk) {
      expect(() => sanitizeRichText(value)).not.toThrow();
    }
  });

  it("is idempotent — sanitising twice changes nothing", () => {
    const once = sanitizeRichText('<div><p class="x">Hi<a href="/a">link</a></p>').html;
    expect(sanitizeRichText(once).html).toBe(once);
    expect(sanitizeRichText(once).stripped).toBe(0);
  });
});
