import { afterEach, describe, expect, it, vi } from "vitest";
import { createSearchClient } from "@/lib/search/client";
import type { Perform, RequestOptions, ServiceResult } from "@/lib/http/result";

function stub() {
  const calls: RequestOptions<unknown>[] = [];
  const perform: Perform = async <T,>(req: RequestOptions<T>): Promise<ServiceResult<T>> => {
    calls.push(req as unknown as RequestOptions<unknown>);
    return { ok: true, data: {} as T };
  };
  return { perform, calls };
}

afterEach(() => vi.unstubAllEnvs());

describe("search client trending (sf-066)", () => {
  it("attaches x-service-key from the server-only env and no key means no call", async () => {
    vi.stubEnv("INTERNAL_SERVICE_KEY", "server-secret");
    const { perform, calls } = stub();
    await createSearchClient(perform).trending(5);
    expect(calls[0]).toMatchObject({
      method: "GET",
      path: "/api/v1/search/internal/trending",
      query: { limit: 5 },
      headers: { "x-service-key": "server-secret" },
    });

    vi.stubEnv("INTERNAL_SERVICE_KEY", "");
    const missing = stub();
    const result = await createSearchClient(missing.perform).trending();
    expect(result.ok).toBe(false);
    expect(missing.calls).toHaveLength(0);
  });
});
