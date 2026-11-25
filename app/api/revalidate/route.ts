/**
 * POST /api/revalidate — sf-050
 * (1.Architecture.md §6.5: the CMS→UI invalidation arrow)
 *
 * cms-svc owns content; the storefront owns its cache. This is the one seam
 * that lets a commit in cms-svc reach the Next Data Cache, and it is the
 * hand-off `cms-007` will call after its own invalidation.
 *
 * Contract (record verbatim in cms-007's task):
 *   POST /api/revalidate
 *   x-revalidate-secret: $REVALIDATE_SECRET
 *   {"tags":["cms:navigation","cms:page-settings:auth"]}
 *   → 200 {"revalidated":[...],"now":<epoch ms>}
 *   → 400 {"error":{"code":"INVALID_TAGS"}}   unknown or malformed tag
 *   → 401 {"error":{"code":"UNAUTHORIZED"}}   missing/wrong secret
 *
 * Three things are deliberate:
 * - `revalidateTag(tag, 'max')` — Next 16 requires the profile argument; the
 *   one-argument form does not compile and silently would not purge eagerly.
 * - The tag allowlist (`lib/cms/tags.ts`) — this endpoint is reachable from
 *   anywhere cms-svc runs, and an unvalidated `revalidateTag` is a way to
 *   flush the whole cache with one loop.
 * - Constant-time compare on the SHA-256 of both strings, so neither the
 *   length nor the content of the secret leaks through timing.
 */

import { createHash, timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { isAllowedTag } from "@/lib/cms/tags";
import { incrementMetric } from "@/lib/metrics/counters";

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isAuthorised(request.headers.get("x-revalidate-secret"))) {
    incrementMetric("revalidate_unauthorized_total");
    return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
  }

  const body = await readJson(request);
  const tags = readTags(body);
  if (tags === null) {
    incrementMetric("revalidate_invalid_tags_total");
    return NextResponse.json({ error: { code: "INVALID_TAGS" } }, { status: 400 });
  }

  for (const tag of tags) revalidateTag(tag, "max");

  return NextResponse.json({ revalidated: tags, now: Date.now() });
}

function isAuthorised(provided: string | null): boolean {
  const secret = process.env.REVALIDATE_SECRET?.trim();
  // No secret configured = nobody is authorised. A missing env var must never
  // turn this into an open cache-flush endpoint.
  if (!secret || !provided) return false;
  return constantTimeEqual(provided, secret);
}

function constantTimeEqual(a: string, b: string): boolean {
  return timingSafeEqual(digest(a), digest(b));
}

function digest(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

async function readJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function readTags(body: unknown): string[] | null {
  if (typeof body !== "object" || body === null) return null;
  const raw = (body as { tags?: unknown }).tags;
  if (!Array.isArray(raw) || raw.length === 0) return null;
  if (!raw.every((tag) => isAllowedTag(tag))) return null;
  return [...new Set(raw as string[])];
}
