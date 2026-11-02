import type { BlogBlock } from "@ecom/contracts";

/**
 * PostBlocks — the four journal block types, in order — sf-063
 * (plan §7: "block renderer for heading/paragraph/image/quote")
 *
 * A `switch`, one case per contract member, and an `assertNever` default: a
 * fifth block type added to cms-svc must become a compile error in this file
 * rather than a paragraph of prose the reader never sees.
 *
 * Rules the block types force on us:
 * - `heading` level 1 is painted as `<h2>`. The post title is the article's
 *   `<h1>`; a document with two `<h1>`s and a skipped level is what an outline
 *   mode reads as a broken page, and the admin's level number is about *rank
 *   inside the body*, not about the title.
 * - `paragraph` text is plain text. The contracts cap it at 20 000 characters
 *   and cms-svc stores it as written, so `\n\n` is the only markup an author
 *   has; `white-space: pre-line` renders that without an HTML sink. Rich
 *   markup lives in `rich_text` *page* blocks (`lib/pages/richText.ts`), and
 *   keeping the two block families honest about each other is deliberate.
 * - `image` alt falls back to the caption, then to `""`. An empty alt is the
 *   correct answer for a decorative photo; the wrong answer is the filename.
 * - `cite` is rendered inside `<figcaption>`, where attribution belongs.
 */
export interface PostBlocksProps {
  blocks: readonly BlogBlock[];
}

export default function PostBlocks({ blocks }: PostBlocksProps) {
  return (
    <div className="sf-post__blocks">
      {blocks.map((block) => {
        switch (block.type) {
          case "heading":
            return <Heading key={block.id} level={block.level} text={block.text} />;
          case "paragraph":
            return <p key={block.id}>{block.text}</p>;
          case "image":
            return (
              <figure key={block.id} className="sf-post__figure">
                <img
                  className="sf-post__img"
                  src={block.url}
                  alt={block.alt ?? block.caption ?? ""}
                  loading="lazy"
                />
                {block.caption !== undefined && block.caption !== "" ? (
                  <figcaption className="sf-post__caption">{block.caption}</figcaption>
                ) : null}
              </figure>
            );
          case "quote":
            return (
              <blockquote key={block.id} className="sf-post__quote">
                <p>{block.quote}</p>
                {block.cite !== undefined && block.cite !== "" ? (
                  <footer>
                    <cite>{block.cite}</cite>
                  </footer>
                ) : null}
              </blockquote>
            );
          default:
            return assertNever(block);
        }
      })}
    </div>
  );
}

/** One intrinsic tag per allowed level. Written as four branches rather than a
 * `Tag` variable because a computed element name from a `Record` is the kind of
 * indirection that type-checks and then renders nothing at runtime. */
function Heading({ level, text }: { level: 1 | 2 | 3 | 4; text: string }) {
  switch (level) {
    case 1:
    case 2:
      return <h2>{text}</h2>;
    case 3:
      return <h3>{text}</h3>;
    case 4:
      return <h4>{text}</h4>;
  }
}

function assertNever(block: never): null {
  void block;
  return null;
}
