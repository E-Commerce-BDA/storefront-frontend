/**
 * Product trust & shipping copy — PDP trust badges.
 *
 * Fallback-only: the buy box no longer renders these. The PDP reads a
 * `pdp_trust` section from the CMS; this list feeds the synthetic outage
 * fallback (`lib/sections/pdp.ts`) when cms-svc is unreachable. Icons are
 * typed by the contracts `PdpTrustIcon` vocabulary, so no cast is needed at
 * paint time.
 */

import type { PdpTrustIcon } from "@ecom/contracts";

export interface TrustItem {
  id: string;
  icon: PdpTrustIcon;
  title: string;
  description: string;
}

export const PRODUCT_TRUST_ITEMS: TrustItem[] = [
  {
    id: "trust-shipping",
    icon: "truck",
    title: "Free shipping",
    description: "Complimentary standard delivery on orders over $50",
  },
  {
    id: "trust-returns",
    icon: "returns",
    title: "Effortless returns",
    description: "30-day complimentary returns and exchanges",
  },
  {
    id: "trust-secure",
    icon: "shield-check",
    title: "Secure checkout",
    description: "256-bit SSL encrypted member transactions",
  },
];
