/**
 * Product-tag → Badge-tone map (editorial cards, photo §sf-023).
 *
 * Single home for the mapping so cards never switch on tag strings.
 * Unknown/absent tags are misses (neutral renders, never blank).
 * Pure map. No React, no fetch.
 */
import type { BadgeTone } from "@/components/ui/Badge";

const TAG_TONES: Record<string, BadgeTone> = {
  Bestseller: "success",
  Organic: "warning",
  Trending: "lilac",
  Waterproof: "info",
};

export function tagTone(tag?: string): BadgeTone {
  if (typeof tag !== "string" || tag === "") return "neutral";
  return TAG_TONES[tag] ?? "neutral";
}
