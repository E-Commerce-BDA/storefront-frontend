import type { CSSProperties } from "react";
import type { BlogTeaserViewModel } from "@/lib/sections/viewModels";
import BlogCard from "@/components/sections/BlogCard";

/**
 * BlogTeaserSection — the latest posts, straight from cms-svc — sf-060
 *
 * Cards only. The post body lives in `/blog/[slug]` (sf-063) and in the shared
 * `BlogCard` painter, so a home teaser and the `/blog` list cannot drift apart.
 * This block's whole job is the grid, the heading and the section chrome: an
 * excerpt the CMS did not write is not invented here.
 */
export interface BlogTeaserSectionProps {
  model: BlogTeaserViewModel;
  className?: string;
}

export default function BlogTeaserSection({ model, className = "" }: BlogTeaserSectionProps) {
  const style = {
    ...(model.bgColor !== undefined ? { "--section-bg": model.bgColor } : {}),
    ...(model.gutterPx !== undefined ? { "--grid-gap": `${model.gutterPx}px` } : {}),
  } as CSSProperties;

  return (
    <section
      className={`sf-section sf-blog-teaser ${className}`}
      style={style}
      aria-label={model.title ?? "From the journal"}
    >
      {model.title !== undefined ? (
        <div className="sf-section__head">
          <h2 className="sf-section__title">{model.title}</h2>
        </div>
      ) : null}

      <ul className="sf-blog__grid" role="list">
        {model.posts.map((post) => (
          <li key={post.slug} className="sf-blog__item">
            <BlogCard post={post} />
          </li>
        ))}
      </ul>
    </section>
  );
}
