import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/metrics/route";
import { incrementMetric, METRIC_NAMES, resetMetrics } from "@/lib/metrics/counters";

beforeEach(resetMetrics);

describe("GET /api/metrics", () => {
  it("exposes the named counters and no secrets", async () => {
    incrementMetric("revalidate_unauthorized_total");
    const response = GET(new NextRequest("http://localhost/api/metrics"));

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-revalidate-secret")).toBeNull();

    const body = (await response.json()) as {
      names: readonly string[];
      metrics: Record<string, number>;
    };
    expect(body.names).toEqual([...METRIC_NAMES]);
    expect(body.metrics.revalidate_unauthorized_total).toBe(1);
    expect(Object.keys(body.metrics)).toHaveLength(METRIC_NAMES.length);
  });
});
