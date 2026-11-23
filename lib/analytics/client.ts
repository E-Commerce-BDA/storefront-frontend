/**
 * Analytics client — sf-052 (server-only)
 *
 * The one place the storefront talks to analytics-svc. Called only from the
 * /api/track BFF route; the browser never sees this module or a service URL.
 * Tracking is fire-and-forget at the caller, so a failure here is a value, not
 * an exception that could reach a shopper's navigation.
 */

import { z } from "zod";
import { createServiceClient } from "@/lib/http/client";

/** The body the BFF accepts, mapped to the contracts page.viewed payload. */
export const trackBeaconSchema = z
  .object({
    page: z.string().min(1).max(2048),
    eventKind: z.enum(["pageview", "heartbeat"]),
    referrer: z.string().max(2048).optional(),
    device: z.enum(["desktop", "mobile", "tablet"]).optional(),
    durationMs: z.number().int().nonnegative().optional(),
    exited: z.boolean().optional(),
  })
  .strict();

export type TrackBeacon = z.infer<typeof trackBeaconSchema>;

/** What analytics-svc 1.16.0 accepts on POST /api/v1/analytics/track. */
export interface AnalyticsTrackBody extends TrackBeacon {
  sessionId: string;
}

const analyticsResponseSchema = z
  .object({ status: z.literal("accepted") })
  .loose();

export interface AnalyticsClient {
  track(body: AnalyticsTrackBody): Promise<{ ok: boolean }>;
}

export function createAnalyticsClient(
  perform = createServiceClient("analytics"),
): AnalyticsClient {
  return {
    async track(body) {
      const result = await perform({
        path: "/api/v1/analytics/track",
        method: "POST",
        body,
        cache: "no-store",
        schema: analyticsResponseSchema,
      });
      return { ok: result.ok };
    },
  };
}

/** Constructed per call so the registry's call-time env read stays honest. */
export function analyticsClient(): AnalyticsClient {
  return createAnalyticsClient(createServiceClient("analytics"));
}
