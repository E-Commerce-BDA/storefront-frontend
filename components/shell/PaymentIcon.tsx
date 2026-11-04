/**
 * PaymentIcon — dumb brand mark for a footer payment method key — sf-062 follow-up
 *
 * The footer's `paymentIcons` are CMS platform keys (`visa`, `upi`, ...), and the
 * contracts schema keeps them that way so the footer never renders arbitrary text.
 * This block maps a known key to a committed monochrome SVG under
 * `public/media/pay/` and paints it; an unknown key falls back to its label, so a
 * newly-added CMS key degrades to readable text instead of a broken image — the
 * same fail-closed rule `components/ui/icons/Icon.tsx` follows for unknown names.
 *
 * No fetch, no state: which keys show is the admin's CMS data; the artwork is a
 * one-file-per-brand swap here.
 */

/** Committed brand marks, keyed by the CMS platform string. */
export const PAYMENT_ICON_ASSETS: Record<string, string> = {
  visa: "/media/pay/visa.svg",
  mastercard: "/media/pay/mastercard.svg",
  paypal: "/media/pay/paypal.svg",
  applepay: "/media/pay/applepay.svg",
  gpay: "/media/pay/gpay.svg",
  upi: "/media/pay/upi.svg",
};

/** Human labels for the alt text / text fallback. Unknown keys use the raw key. */
const PAYMENT_ICON_LABELS: Record<string, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  paypal: "PayPal",
  applepay: "Apple Pay",
  gpay: "Google Pay",
  upi: "UPI",
};

export interface PaymentIconProps {
  /** CMS platform key, e.g. `visa`. */
  icon: string;
  className?: string;
}

export default function PaymentIcon({ icon, className }: PaymentIconProps) {
  const label = PAYMENT_ICON_LABELS[icon] ?? icon;
  const src = PAYMENT_ICON_ASSETS[icon];

  if (!src) {
    // Fail closed to the label rather than a broken <img> for an unknown key.
    return <span className={className}>{label}</span>;
  }

  return <img className={className} src={src} alt={label} loading="lazy" />;
}
