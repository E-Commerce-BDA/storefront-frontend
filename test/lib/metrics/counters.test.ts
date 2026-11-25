import { beforeEach, describe, expect, it } from "vitest";
import {
  incrementMetric,
  METRIC_NAMES,
  metricSnapshot,
  resetMetrics,
} from "@/lib/metrics/counters";

beforeEach(resetMetrics);

describe("counter registry", () => {
  it("starts every named counter at zero", () => {
    expect(metricSnapshot()).toEqual({
      cms_stale_reads_total: 0,
      cms_fallback_reads_total: 0,
      revalidate_unauthorized_total: 0,
      revalidate_invalid_tags_total: 0,
    });
    expect(Object.keys(metricSnapshot())).toEqual([...METRIC_NAMES]);
  });

  it("accumulates and returns a copy, not the live object", () => {
    incrementMetric("cms_fallback_reads_total");
    incrementMetric("cms_fallback_reads_total", 2);
    const snapshot = metricSnapshot();
    snapshot.cms_fallback_reads_total = 99;
    expect(metricSnapshot().cms_fallback_reads_total).toBe(3);
  });
});
