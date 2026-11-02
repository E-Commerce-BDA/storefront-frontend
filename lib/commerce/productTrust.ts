/**
 * Product trust & shipping copy — PDP trust badges
 *
 * Core static guarantees displayed in the buy box below the CTA.
 */

export interface TrustItem {
  icon: string;
  title: string;
  description: string;
}

export const PRODUCT_TRUST_ITEMS: TrustItem[] = [
  {
    icon: "truck",
    title: "Free shipping",
    description: "Complimentary standard delivery on orders over $50",
  },
  {
    icon: "returns",
    title: "Effortless returns",
    description: "30-day complimentary returns and exchanges",
  },
  {
    icon: "shield-check",
    title: "Secure checkout",
    description: "256-bit SSL encrypted member transactions",
  },
];
