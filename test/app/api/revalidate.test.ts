/**
 * POST /api/revalidate — the CMS→UI invalidation arrow.
 *
 * The assertion that matters is the negative one: on a rejected call
 * `revalidateTag` must not run at all. An endpoint that purges first and
 * authorises second still looks correct from the outside, so every failure
 * case here proves the purge did not happen.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const nextCache = vi.hoisted(() => ({ revalidateTag: vi.fn() }));

vi.mock("next/cache", () => ({ revalidateTag: nextCache.revalidateTag }));

const { POST } = await import("@/app/api/revalidate/route");

const SECRET = "s3cret-revalidate-value";

function request(init: { secret?: string | null; body?: unknown; raw?: string } = {}): NextRequest {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (init.secret !== null && init.secret !== undefined) headers["x-revalidate-secret"] = init.secret;

  return new NextRequest("http://localhost/api/revalidate", {
    method: "POST",
    headers,
    body: init.raw ?? JSON.stringify(init.body ?? { tags: ["cms:navigation"] }),
  });
}

beforeEach(() => {
  vi.stubEnv("REVALIDATE_SECRET", SECRET);
  nextCache.revalidateTag.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("POST /api/revalidate — authorisation", () => {
  it("rejects a missing secret and purges nothing", async () => {
    const response = await POST(request({ secret: null }));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: { code: "UNAUTHORIZED" } });
    expect(nextCache.revalidateTag).not.toHaveBeenCalled();
  });

  it("rejects a wrong secret and purges nothing", async () => {
    const response = await POST(request({ secret: `${SECRET}!` }));

    expect(response.status).toBe(401);
    expect(nextCache.revalidateTag).not.toHaveBeenCalled();
  });

  it("fails closed when the server has no secret configured", async () => {
    vi.stubEnv("REVALIDATE_SECRET", "");
    const response = await POST(request({ secret: SECRET }));

    expect(response.status).toBe(401);
    expect(nextCache.revalidateTag).not.toHaveBeenCalled();
  });
});

describe("POST /api/revalidate — tag validation", () => {
  it.each([
    ["an unknown prefix", { tags: ["cart:total"] }],
    ["an empty page key", { tags: ["cms:page-settings:"] }],
    ["a traversal-shaped key", { tags: ["cms:page-settings:../admin"] }],
    ["no tags key", { revalidate: true }],
    ["an empty array", { tags: [] }],
    ["a string instead of an array", { tags: "cms:navigation" }],
    ["a mixed array", { tags: ["cms:navigation", "arbitrary"] }],
    ["a nested array", { tags: [["cms:navigation"]] }],
  ])("rejects %s with 400 and purges nothing", async (_label, body) => {
    const response = await POST(request({ secret: SECRET, body }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: { code: "INVALID_TAGS" } });
    expect(nextCache.revalidateTag).not.toHaveBeenCalled();
  });

  it("rejects an unparseable body without throwing", async () => {
    const response = await POST(request({ secret: SECRET, raw: "<html>not json</html>" }));

    expect(response.status).toBe(400);
    expect(nextCache.revalidateTag).not.toHaveBeenCalled();
  });
});

describe("POST /api/revalidate — the happy path", () => {
  it("purges each allowed tag exactly once, with the 'max' profile", async () => {
    const response = await POST(
      request({ secret: SECRET, body: { tags: ["cms:navigation", "cms:page-settings:auth"] } }),
    );

    expect(response.status).toBe(200);
    expect(nextCache.revalidateTag).toHaveBeenCalledTimes(2);
    expect(nextCache.revalidateTag).toHaveBeenCalledWith("cms:navigation", "max");
    expect(nextCache.revalidateTag).toHaveBeenCalledWith("cms:page-settings:auth", "max");

    const body = (await response.json()) as { revalidated: string[]; now: number };
    expect(body.revalidated).toEqual(["cms:navigation", "cms:page-settings:auth"]);
    expect(Number.isFinite(body.now)).toBe(true);
  });

  it("deduplicates repeats so one tag is not purged twice", async () => {
    const response = await POST(
      request({ secret: SECRET, body: { tags: ["cms:navigation", "cms:navigation"] } }),
    );

    expect(response.status).toBe(200);
    expect(nextCache.revalidateTag).toHaveBeenCalledTimes(1);
    expect(((await response.json()) as { revalidated: string[] }).revalidated).toEqual(["cms:navigation"]);
  });

  it("never echoes the secret back", async () => {
    const response = await POST(request({ secret: SECRET }));
    const raw = await response.text();

    expect(raw).not.toContain(SECRET);
  });
});
