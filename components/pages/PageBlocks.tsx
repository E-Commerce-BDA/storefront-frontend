import type { PageBlock } from "@ecom/contracts";
import Button from "@/components/ui/Button";
import { richTextHtml } from "@/lib/pages/richText";

/**
 * PageBlocks — the four page block types, in order — sf-063
 * (plan §7: `/about`, `/privacy`, `/terms` share one renderer)
 *
 * The legal/company counterpart of `components/blog/PostBlocks`, and the reason
 * those routes have no copy of their own: whatever the admin composes in cms-svc
 * is what ships, with no "static privacy text plus a CMS override" hybrid.
 *
 * Per type:
 * - `rich_text` is the only HTML sink in the app. It goes through
 *   `richTextHtml()` — an allowlist scanner whose unit test is an attack list —
 *   and an empty result renders no element at all.
 * - `image` behaves exactly like a post image: caption is the alt fallback, lazy
 *   by default, and a page banner is a `<figure>` with a caption slot rather
 *   than a background image (a background cannot be read by a screen reader or
 *   printed).
 * - `cta` reuses `Button`, so a page button is the same painted control as a
 *   hero button — same wave, same disabled rules, same `href` behaviour. The
 *   contract's `link` is an internal path, so no external branch is needed.
 * - `faq` is `<details>`/`<summary>`: keyboard-accessible disclosure with zero
 *   JS, and closed by default so a 50-item FAQ does not become a wall of text.
 *   Answers allow no markup (the contract says plain text, max 5000), so
 *   `white-space: pre-line` is the whole styling story.
 */
export interface PageBlocksProps {
  blocks: readonly PageBlock[];
}

export default function PageBlocks({ blocks }: PageBlocksProps) {
  return (
    <div className="sf-page__blocks">
      {blocks.map((block) => {
        switch (block.type) {
          case "rich_text": {
            const html = richTextHtml(block.body);
            if (html === "") return null;
            return (
              <div
                key={block.id}
                className="sf-prose"
                // Inert by construction: `richTextHtml` removed every element
                // and attribute outside its allowlist before it got here.
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          }
          case "image":
            return (
              <figure key={block.id} className="sf-page__figure">
                <img
                  className="sf-page__img"
                  src={block.url}
                  alt={block.alt ?? block.caption ?? ""}
                  loading="lazy"
                />
                {block.caption !== undefined && block.caption !== "" ? (
                  <figcaption className="sf-page__caption">{block.caption}</figcaption>
                ) : null}
              </figure>
            );
          case "cta":
            return (
              <section key={block.id} className="sf-page__cta" aria-label={block.title || undefined}>
                {block.title !== undefined && block.title !== "" ? (
                  <h2 className="sf-page__cta-title">{block.title}</h2>
                ) : null}
                {block.ctas.length > 0 ? (
                  <div className="sf-page__cta-row">
                    {block.ctas.map((cta, index) => (
                      // A block may legitimately link twice ("Shop now" and
                      // "Browse deals" both → /products), so the href is no key.
                      <Button
                        key={`${cta.id}-${index}`}
                        href={cta.link}
                        variant={index === 0 ? "primary" : "light"}
                        bg={cta.bg}
                        textColor={cta.textColor}
                        borderColor={cta.borderColor}
                        borderWidth={cta.borderWidth}
                        borderRadius={cta.borderRadius}
                      >
                        {cta.text}
                      </Button>
                    ))}
                  </div>
                ) : null}
              </section>
            );
          case "faq":
            return (
              <div key={block.id} className="sf-faq">
                {block.items.map((item, index) => (
                  <details key={`${item.question}-${index}`} className="sf-faq__item">
                    <summary className="sf-faq__q">{item.question}</summary>
                    <p className="sf-faq__a">{item.answer}</p>
                  </details>
                ))}
              </div>
            );
          default:
            return assertNever(block);
        }
      })}
    </div>
  );
}

function assertNever(block: never): null {
  void block;
  return null;
}
