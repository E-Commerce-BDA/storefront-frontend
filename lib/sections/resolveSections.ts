/**
 * Section resolver — sf-060
 * (plan §6: "takes Section[], fans out catalog/cms reads, returns view models
 * in sortOrder")
 *
 * The only place the home page's data fan-out lives. The blocks stay dumb and
 * the route stays 15 lines because every rule that needs more than a prop is
 * decided here, once:
 *
 * - **Order** is the CMS `sortOrder`; the resolver never re-sorts.
 * - **Inactive and empty are both skips.** A hero with no slides and a strip
 *   whose brands all vanished render *nothing* — an empty box is theatre.
 * - **A dead service skips only its own section.** `null` from a dep means the
 *   catalog or the CMS is down; that is this section's outage, not the page's.
 *   An empty-but-successful answer is also a skip, and the two cases are
 *   deliberately indistinguishable to the shopper — the difference is in the
 *   console, for whoever is on call.
 * - **Manual order survives.** `ids` round-trips through catalog-svc pinned by
 *   `array_position`, but the resolver re-orders client-side anyway: a section
 *   whose curated order silently became "whatever the DB returned" would be a
 *   CMS lie, and re-sorting is free.
 * - **Sparse style keys stay sparse.** `gutter`/`ratio`/`bgColor` reach the
 *   block only when the admin actually set them; absent keeps the CSS token
 *   fallback chain alive (sections.md §4 — the same reason the card resolver
 *   does not pre-resolve theme values).
 */

import type { Blog, Section } from "@ecom/contracts";
import { catalogClient } from "@/lib/catalog/client";
import { cmsBaseUrl, createCmsClient } from "@/lib/cms/client";
import type { CatalogProduct } from "@/lib/commerce/fromCatalog";
import { fromCatalogList } from "@/lib/commerce/fromCatalog";
import type {
  CategoryTileModel,
  SectionCardOverrides,
  SectionCtaModel,
  SectionViewModel,
} from "./viewModels";

export const HOME_PAGE_KEY = "homepage";

/** `featured_products` with no `maxItems`: the same strip width sf-051 used. */
export const DEFAULT_PRODUCT_LIMIT = 8;
/** `blog_teaser` with no `count`: three cards fit a row without a wrap orphan. */
export const DEFAULT_TEASER_COUNT = 3;

/**
 * Data sources, injected. The defaults hit the real services; tests hand in
 * fixed tables. A function returning `null` means "this service is down" — the
 * caller's section is skipped and nothing else is told.
 */
export interface SectionResolveDeps {
  products(query: {
    ids?: string[];
    limit?: number;
    sort?: "created_desc";
  }): Promise<CatalogProduct[] | null>;
  categories(): Promise<Array<{ id: string; name: string; slug: string; imageUrl?: string | null; isActive?: boolean }> | null>;
  brands(): Promise<Array<{ id: string; name: string; slug: string; logoUrl?: string | null; isActive?: boolean; sortOrder?: number }> | null>;
  blogs(): Promise<Blog[] | null>;
}

export function defaultSectionDeps(): SectionResolveDeps {
  const catalog = catalogClient();
  const cms = createCmsClient({ baseUrl: cmsBaseUrl() });
  return {
    async products(query) {
      const page = await catalog.listProducts(
        query.ids ? { ids: query.ids } : { limit: query.limit, sort: query.sort },
      );
      return page.ok ? page.data.items : null;
    },
    async categories() {
      const result = await catalog.listCategories();
      return result.ok ? result.data : null;
    },
    async brands() {
      const result = await catalog.listBrands();
      return result.ok ? result.data : null;
    },
    async blogs() {
      const list = await cms.listBlogs({ limit: 12 });
      return list ? list.data : null;
    },
  };
}

/**
 * CMS sections → renderable view models, in the CMS order.
 *
 * Never throws: one malformed section (a content shape newer than this
 * renderer, a slide with a blank headline) costs that section, not the page.
 */
export async function resolveSections(
  sections: readonly Section[],
  deps: SectionResolveDeps = defaultSectionDeps(),
): Promise<SectionViewModel[]> {
  const ordered = [...sections].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const out: SectionViewModel[] = [];
  for (const section of ordered) {
    if (section.isActive === false) continue;
    try {
      const model = await buildViewModel(section, deps);
      if (model !== null) out.push(model);
    } catch (error) {
      console.error(`[sections] skipped "${section.key}"`, error);
    }
  }
  return out;
}

async function buildViewModel(
  section: Section,
  deps: SectionResolveDeps,
): Promise<SectionViewModel | null> {
  switch (section.type) {
    case "hero":
      return heroModel(section);
    case "banner":
      // The banner sibling is sf-061 scope; refusing it loudly is better
      // than painting a half-understood strip.
      return null;
    case "featured_products":
      return featuredModel(section, deps);
    case "category_showcase":
      return categoryModel(section, deps);
    case "brand_strip":
      return brandModel(section, deps);
    case "blog_teaser":
      return blogTeaserModel(section, deps);
    case "testimonial":
      return testimonialModel(section);
  }
}

/* ── shared primitives ────────────────────────────────────────────────────── */

/** House rule: first CTA is primary, second light, the third quiet. */
export function toCtaModels(ctas: readonly { text: string; link: string; bg?: string; textColor?: string; borderColor?: string; borderWidth?: number; borderRadius?: number }[] | undefined): SectionCtaModel[] {
  return (ctas ?? []).slice(0, 3).map((cta, i) => ({
    text: cta.text,
    href: cta.link,
    variant: i === 0 ? "primary" : i === 1 ? "light" : "ghost-ink",
    ...(cta.bg !== undefined ? { bg: cta.bg } : {}),
    ...(cta.textColor !== undefined ? { textColor: cta.textColor } : {}),
    ...(cta.borderColor !== undefined ? { borderColor: cta.borderColor } : {}),
    ...(cta.borderWidth !== undefined ? { borderWidth: cta.borderWidth } : {}),
    ...(cta.borderRadius !== undefined ? { borderRadius: cta.borderRadius } : {}),
  }));
}

function nonempty(value: string | undefined | null): value is string {
  return typeof value === "string" && value.trim() !== "";
}

/* ── per-type builders ────────────────────────────────────────────────────── */

function heroModel(section: Extract<Section, { type: "hero" }>): SectionViewModel | null {
  const settings = section.settings;
  // A slide with no ratio inherits the section's; `custom` is the one CMS value
  // that is a number rather than a pair, and the block's `toCssRatio` passes a
  // plain number through untouched.
  const sectionRatio =
    settings?.ratio === "custom"
      ? typeof settings.customRatio === "number"
        ? String(settings.customRatio)
        : undefined
      : settings?.ratio;

  const slides = section.content.slides
    .filter((slide) => nonempty(slide.headline))
    .map((slide) => ({
      id: slide.id,
      ...(nonempty(slide.eyebrow) ? { eyebrow: slide.eyebrow } : {}),
      headline: slide.headline,
      ...(nonempty(slide.subcopy) ? { subcopy: slide.subcopy } : {}),
      ...(nonempty(slide.image)
        ? { media: { src: slide.image, alt: slide.imageAlt ?? "" } }
        : {}),
      ...(slide.ratio !== undefined || sectionRatio !== undefined
        ? { ratio: slide.ratio ?? sectionRatio }
        : {}),
      ...(nonempty(slide.bgColor) ? { bgColor: slide.bgColor } : {}),
      ...(nonempty(slide.textColor) ? { textColor: slide.textColor } : {}),
      ctas: toCtaModels(slide.ctas),
    }));
  if (slides.length === 0) return null;

  return {
    key: section.key,
    type: "hero",
    slides,
    height: settings?.height === "viewport" ? "viewport" : "auto",
    ...(nonempty(settings?.bgColor) ? { bgColor: settings.bgColor } : {}),
  };
}

async function featuredModel(
  section: Extract<Section, { type: "featured_products" }>,
  deps: SectionResolveDeps,
): Promise<SectionViewModel | null> {
  const { title, source, productIds } = section.content;
  const maxItems = section.settings?.maxItems ?? DEFAULT_PRODUCT_LIMIT;

  let rows: CatalogProduct[] | null;
  if (source === "newest" || !productIds || productIds.length === 0) {
    rows = await deps.products({ limit: maxItems, sort: "created_desc" });
  } else {
    rows = await deps.products({ ids: productIds.slice(0, 24) });
    if (rows !== null) rows = orderByIds(rows, productIds);
  }
  if (rows === null || rows.length === 0) return null;

  const cards = fromCatalogList(rows).slice(0, maxItems);
  if (cards.length === 0) return null;

  const settings = section.settings;
  // The card resolver type-guards `mediaRatio` against its own enum, and every
  // CMS ratio except `custom` (a number) is in it; a custom thumbnail ratio is
  // not something a product card can honour, so it simply does not reach one.
  const mediaRatio =
    settings?.ratio !== undefined && settings.ratio !== "custom" ? settings.ratio : undefined;
  const cardOverrides: SectionCardOverrides = {
    ...(mediaRatio !== undefined ? { mediaRatio } : {}),
    ...(settings?.blendMode !== undefined ? { imageBlendMode: settings.blendMode } : {}),
  };
  return {
    key: section.key,
    type: "product_collection",
    ...(nonempty(title) ? { title } : {}),
    cards,
    layout: section.content.layout === "carousel" ? "carousel" : "grid",
    ...(typeof settings?.gutter === "number" ? { gutterPx: settings.gutter } : {}),
    ...(nonempty(settings?.bgColor) ? { bgColor: settings.bgColor } : {}),
    ...(Object.keys(cardOverrides).length > 0 ? { cardOverrides } : {}),
  };
}

async function categoryModel(
  section: Extract<Section, { type: "category_showcase" }>,
  deps: SectionResolveDeps,
): Promise<SectionViewModel | null> {
  const rows = await deps.categories();
  if (rows === null) return null;

  const maxItems = section.settings?.maxItems ?? 12;
  const ids = section.content.categoryIds ?? [];
  let picked: CategoryTileModel[];
  if (ids.length > 0) {
    picked = orderByIds(rows.filter((row) => ids.includes(row.id)), ids).map(toTile);
  } else {
    picked = rows
      .filter((row) => row.isActive !== false)
      .slice(0, maxItems)
      .map(toTile);
  }
  if (picked.length === 0) return null;

  const settings = section.settings;
  return {
    key: section.key,
    type: "category_showcase",
    ...(nonempty(section.content.title) ? { title: section.content.title } : {}),
    categories: picked.slice(0, maxItems),
    showPhotos: settings?.showPhotos !== false,
    ...(typeof settings?.gutter === "number" ? { gutterPx: settings.gutter } : {}),
    ...(nonempty(settings?.bgColor) ? { bgColor: settings.bgColor } : {}),
  };
}

function toTile(row: { id: string; name: string; slug: string; imageUrl?: string | null }): CategoryTileModel {
  return {
    id: row.id,
    name: row.name,
    href: `/products?category=${encodeURIComponent(row.slug)}`,
    ...(nonempty(row.imageUrl) ? { image: row.imageUrl } : {}),
  };
}

async function brandModel(
  section: Extract<Section, { type: "brand_strip" }>,
  deps: SectionResolveDeps,
): Promise<SectionViewModel | null> {
  const rows = await deps.brands();
  if (rows === null) return null;

  const maxItems = section.settings?.maxItems ?? 12;
  const { items, brandIds } = section.content;
  let pickedRows: typeof rows;
  const labels = new Map<string, string>();

  if (items && items.length > 0) {
    // The ordered selection wins over `brandIds`; ids the catalog does not
    // return are skipped (section-content.ts: a mismatch never 404s the strip).
    const wanted = new Set<string>();
    for (const item of items) {
      wanted.add(item.brandId);
      if (nonempty(item.label)) labels.set(item.brandId, item.label);
    }
    pickedRows = orderByIds(
      rows.filter((row) => wanted.has(row.id)),
      items.map((item) => item.brandId),
    );
  } else if (brandIds && brandIds.length > 0) {
    pickedRows = orderByIds(rows.filter((row) => brandIds.includes(row.id)), brandIds);
  } else {
    pickedRows = [...rows]
      .filter((row) => row.isActive !== false && nonempty(row.logoUrl))
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }

  const brands = pickedRows.slice(0, maxItems).map((row) => ({
    id: row.id,
    ...(labels.get(row.id) !== undefined ? { label: labels.get(row.id) } : {}),
    ...(nonempty(row.logoUrl) ? { logo: row.logoUrl } : {}),
    name: row.name,
    href: `/products?brand=${encodeURIComponent(row.slug)}`,
  }));
  if (brands.length === 0) return null;

  const settings = section.settings;
  return {
    key: section.key,
    type: "brand_strip",
    ...(nonempty(section.content.title) ? { title: section.content.title } : {}),
    brands,
    motion: settings?.motion === "marquee" ? "marquee" : "static",
    speed: settings?.speed ?? 60,
    direction: settings?.direction === "right" ? "right" : "left",
    pauseOnHover: settings?.pauseOnHover !== false,
    ...(nonempty(settings?.bgColor) ? { bgColor: settings.bgColor } : {}),
  };
}

function testimonialModel(
  section: Extract<Section, { type: "testimonial" }>,
): SectionViewModel | null {
  const maxItems = section.settings?.maxItems ?? 12;
  const items = (section.content.items ?? []).slice(0, maxItems);
  if (items.length === 0) return null;

  const settings = section.settings;
  return {
    key: section.key,
    type: "testimonial",
    ...(nonempty(section.content.title) ? { title: section.content.title } : {}),
    items: items.map((item) => ({
      id: item.id,
      quote: item.quote,
      name: item.name,
      ...(nonempty(item.role) ? { role: item.role } : {}),
      ...(nonempty(item.avatar) ? { avatar: item.avatar } : {}),
      ...(typeof item.rating === "number" ? { rating: item.rating } : {}),
      ...(item.verified !== undefined ? { verified: item.verified } : {}),
      ...(nonempty(item.date) ? { date: item.date } : {}),
    })),
    layout: settings?.layout === "marquee" ? "marquee" : "grid",
    speed: settings?.speed ?? 60,
    pauseOnHover: settings?.pauseOnHover !== false,
    ...(nonempty(settings?.bgColor) ? { bgColor: settings.bgColor } : {}),
  };
}

async function blogTeaserModel(
  section: Extract<Section, { type: "blog_teaser" }>,
  deps: SectionResolveDeps,
): Promise<SectionViewModel | null> {
  const posts = await deps.blogs();
  if (posts === null) return null;

  const count = Math.min(
    section.content.count ?? section.settings?.maxItems ?? DEFAULT_TEASER_COUNT,
    12,
  );
  let picked = posts;
  const ids = section.content.postIds ?? [];
  if (ids.length > 0) {
    // The list speaks `id`; the contract types `postIds` as uuids, which a
    // Mongo `_id` stringified is not guaranteed to be — match on both.
    picked = orderByIds(posts.filter((post) => ids.includes(post.id)), ids);
  }
  const cards = picked.slice(0, count).map((post) => ({
    slug: post.slug,
    title: post.title,
    href: `/blog/${encodeURIComponent(post.slug)}`,
    ...(nonempty(post.excerpt) ? { excerpt: post.excerpt } : {}),
    ...(nonempty(post.coverUrl) ? { cover: post.coverUrl } : {}),
    ...(nonempty(post.publishedAt) ? { publishedAt: post.publishedAt } : {}),
  }));
  if (cards.length === 0) return null;

  const settings = section.settings;
  return {
    key: section.key,
    type: "blog_teaser",
    ...(nonempty(section.content.title) ? { title: section.content.title } : {}),
    posts: cards,
    ...(typeof settings?.gutter === "number" ? { gutterPx: settings.gutter } : {}),
    ...(nonempty(settings?.bgColor) ? { bgColor: settings.bgColor } : {}),
  };
}

/** Pin rows to the given id order — the curated order is the content. */
function orderByIds<T extends { id: string }>(rows: readonly T[], ids: readonly string[]): T[] {
  const byId = new Map(rows.map((row) => [row.id, row]));
  const ordered: T[] = [];
  for (const id of ids) {
    const row = byId.get(id);
    if (row !== undefined) ordered.push(row);
  }
  return ordered;
}
