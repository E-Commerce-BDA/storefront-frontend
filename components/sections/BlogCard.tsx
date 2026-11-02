import type { BlogTeaserCardModel } from "@/lib/sections/viewModels";
import { formatMonthYear } from "@/lib/sections/present";

/**
 * BlogCard — one journal card, the same painter in two places — sf-063
 *
 * Extracted from `BlogTeaserSection` (sf-060) because `/blog` needed the exact
 * same face: cover, date, title, excerpt, one link. Leaving the markup in the
 * section and re-typing it in the route is how a card drifts from its sibling —
 * one keeps its cover on a wide screen, the other does not, and both are
 * "correct" until somebody compares them.
 *
 * Dumb like every block: the model is the whole input, the `href` is already
 * built, and a post with no cover is a text card, not a grey placeholder.
 */
export interface BlogCardProps {
  post: BlogTeaserCardModel;
}

export default function BlogCard({ post }: BlogCardProps) {
  const date = formatMonthYear(post.publishedAt);
  return (
    <a className="sf-blog-card" href={post.href}>
      {post.cover !== undefined ? (
        <span className="sf-blog-card__media">
          <img className="sf-blog-card__img" src={post.cover} alt="" loading="lazy" />
        </span>
      ) : null}
      <span className="sf-blog-card__body">
        {date !== undefined ? (
          <time className="sf-blog-card__date" dateTime={post.publishedAt}>
            {date}
          </time>
        ) : null}
        <span className="sf-blog-card__title">{post.title}</span>
        {post.excerpt !== undefined ? (
          <span className="sf-blog-card__excerpt">{post.excerpt}</span>
        ) : null}
      </span>
    </a>
  );
}
