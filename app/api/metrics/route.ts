/**
 * GET /api/metrics — the storefront's one metrics surface (sf-073)
 *
 * The storefront had no scrapeable surface: the CMS fallback paths and the
 * revalidation webhook's rejected calls were logged but never counted. This
 * route exposes the counters from `lib/metrics/counters`, nothing else — no
 * secrets, no user data, no service URLs. `no-store` keeps a scrape from
 * reading yesterday's numbers.
 */

import type { NextRequest, NextResponse } from "next/server";
import { jsonNoStore } from "@/lib/bff/handler";
import { METRIC_NAMES, metricSnapshot } from "@/lib/metrics/counters";

export function GET(_request: NextRequest): NextResponse {
  const snapshot = metricSnapshot();
  return jsonNoStore({ metrics: snapshot, names: METRIC_NAMES });
}
