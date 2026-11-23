/**
 * Rich-text sanitizer — sf-063
 * (plan §7: "dependency-free allowlist sanitizer — permanent safe rendering of
 * admin HTML")
 *
 * A `rich_text` page block is HTML the admin typed, and `dangerouslySetInnerHTML`
 * is the only way to render HTML in React. That is acceptable **only** if the
 * string is provably inert before it reaches the DOM, so this file owns the whole
 * answer: one allowlist of tags, one attribute (`a[href]`), internal links only,
 * and everything else removed rather than escaped-and-kept.
 *
 * Why a hand-rolled scanner instead of a dependency: the allowlist is eleven tags.
 * A library that sanitizes the entire HTML spec would be a larger attack surface
 * than the problem, an update channel we do not control, and it would still have
 * to be configured down to exactly this list. This file has no dependencies, and
 * its unit test is the specification — including the vectors that must not
 * survive (`<img onerror>`, `<svg onload>`, `javascript:` hrefs, mangled tags).
 *
 * Unknown tags are *unwrapped*: their text stays, their markup goes, so an admin
 * who pasted `<div class="note">` still reads their sentence. The content of
 * `<script>`/`<style>` is dropped entirely — that text was never prose.
 */

const ALLOWED_TAGS: readonly string[] = [
  "p",
  "h2",
  "h3",
  "h4",
  "ul",
  "ol",
  "li",
  "strong",
  "em",
  "br",
  "a",
];

const VOID_TAGS: readonly string[] = ["br"];

/** Their *content* is code, not prose — dropping the tag must drop the text. */
const OPAQUE_TAGS: readonly string[] = ["script", "style", "textarea", "title"];

const TAG_RE = /^<(\/?)([a-zA-Z][a-zA-Z0-9]*)([^>]*)>/;

/** Entities the input may already contain; a bare `&` is escaped as text. A
 * named or numeric reference is inert, so it is left alone rather than
 * double-encoded into visible `&amp;copy;` noise. */
const ENTITY_LOOKAHEAD = /&(?!(?:#[0-9]{1,5}|#[xX][0-9a-fA-F]{1,4}|[a-zA-Z][a-zA-Z0-9]{1,31});)/g;

/** Internal path (`/about`, `/blog/x`) — never `//host`, never `javascript:`. */
export function isInternalHref(value: string): boolean {
  const href = value.trim();
  if (href === "") return false;
  if (!href.startsWith("/")) return false;
  // `//host` is protocol-relative, `/\host` is a Windows-ish alias for it, and a
  // backslash anywhere makes the browser resolve a host. None are internal.
  return !href.startsWith("//") && !href.includes("\\");
}

function escapeText(value: string): string {
  return value
    .replace(ENTITY_LOOKAHEAD, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function readHref(attrs: string): string | undefined {
  const match = attrs.match(/href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'`=<>]+))/i);
  if (!match) return undefined;
  return (match[1] ?? match[2] ?? match[3] ?? "").trim();
}

export interface SanitizedRichText {
  html: string;
  stripped: number;
}

/**
 * Allowlist scan of an admin HTML string.
 *
 * Never throws: the worst input in the world (a truncated tag, a bare `<`, a
 * 50 000-character paste) returns inert text. Tags left open at the end are
 * closed, so the output is always balanced and cannot restructure the page it is
 * injected into.
 */
export function sanitizeRichText(input: string): SanitizedRichText {
  let rest = typeof input === "string" ? input : "";
  let html = "";
  /** Allowed elements currently open, so a stray closer cannot nest a lie. */
  const open: string[] = [];
  let stripped = 0;

  while (rest.length > 0) {
    const lt = rest.indexOf("<");
    if (lt === -1) {
      html += escapeText(rest);
      break;
    }
    if (lt > 0) {
      html += escapeText(rest.slice(0, lt));
      rest = rest.slice(lt);
    }

    // A comment is not content.
    if (rest.startsWith("<!--")) {
      const end = rest.indexOf("-->", 4);
      rest = end === -1 ? "" : rest.slice(end + 3);
      stripped += 1;
      continue;
    }

    const match = TAG_RE.exec(rest);
    if (match === null) {
      html += "&lt;";
      rest = rest.slice(1);
      continue;
    }

    const [, slashRaw, nameRaw, attrs] = match;
    const closing = slashRaw === "/";
    const name = nameRaw.toLowerCase();
    rest = rest.slice(match[0].length);

    if (!ALLOWED_TAGS.includes(name)) {
      stripped += 1;
      if (closing) continue; // closer for a tag we will never open
      if (OPAQUE_TAGS.includes(name)) {
        // Drop the element *and* its body: code is not prose.
        const closer = rest.toLowerCase().indexOf(`</${name}`);
        rest = closer === -1 ? "" : rest.slice(closer);
      }
      continue;
    }

    if (closing) {
      const index = open.lastIndexOf(name);
      if (index === -1) {
        stripped += 1;
        continue; // closer with no opener
      }
      // Close it and anything still open inside it, keeping the tree balanced.
      while (open.length > index) {
        html += `</${open.pop()}>`;
      }
      continue;
    }

    if (VOID_TAGS.includes(name)) {
      if (attrs.trim() !== "" && attrs.trim() !== "/") stripped += 1; // attrs on a <br> are dropped
      html += "<br>";
      continue;
    }

    if (name === "a") {
      const href = readHref(attrs);
      if (href === undefined || !isInternalHref(href)) {
        // Unwrap: the label stays readable, the dead or dangerous link does not exist.
        stripped += 1;
        continue;
      }
      html += `<a href="${escapeText(href)}">`;
      open.push("a");
      if (attrs.replace(/href\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'`=<>]+)/i, "").trim() !== "") {
        stripped += 1; // every other attribute on the anchor is gone
      }
      continue;
    }

    if (attrs.trim() !== "" && attrs.trim() !== "/") stripped += 1; // attributes never survive
    html += `<${name}>`;
    open.push(name);
  }

  while (open.length > 0) {
    html += `</${open.pop()}>`;
  }

  return { html, stripped };
}

/** The block renderer's rule: blank input renders nothing at all. */
export function richTextHtml(input: string): string {
  const trimmed = (typeof input === "string" ? input : "").trim();
  if (trimmed === "") return "";
  return sanitizeRichText(trimmed).html;
}
