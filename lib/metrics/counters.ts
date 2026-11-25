/**
 * Storefront counters — sf-073
 *
 * A log line is not a metric: a scrape needs a number that survives between
 * requests. This is the one counter registry in the repo, deliberately
 * process-local — the storefront has no Redis client (AGENTS.md §1), and a
 * counter that resets on deploy is an honest trade for not adding a service.
 *
 * Pure and injection-friendly: no framework imports, named constants only,
 * and a reset used by tests. The readers increment at the *branch* that chose
 * stale or fallback, never at a call site that might also be a healthy read.
 */

export const METRIC_NAMES = [
  "cms_stale_reads_total",
  "cms_fallback_reads_total",
  "revalidate_unauthorized_total",
  "revalidate_invalid_tags_total",
] as const;

export type MetricName = (typeof METRIC_NAMES)[number];
export type MetricSnapshot = Record<MetricName, number>;

const counts: MetricSnapshot = {
  cms_stale_reads_total: 0,
  cms_fallback_reads_total: 0,
  revalidate_unauthorized_total: 0,
  revalidate_invalid_tags_total: 0,
};

export function incrementMetric(name: MetricName, by = 1): void {
  counts[name] += by;
}

export function metricSnapshot(): MetricSnapshot {
  return { ...counts };
}

/** Test-only: a scrape is cumulative, a test needs a clean slate. */
export function resetMetrics(): void {
  for (const name of METRIC_NAMES) counts[name] = 0;
}
