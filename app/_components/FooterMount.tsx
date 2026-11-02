"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/shell/Footer";
import type { Footer as FooterDocument } from "@ecom/contracts";

/** Auth routes stay chromeless — the same list NavbarMount guards, kept
 *  literal here rather than shared: two shell islands reading one constant
 *  would couple the navbar's decision to the footer's, and they are allowed to
 *  differ (a sign-in page with a footer is fine; one with a nav bar is not). */
const AUTH_PATHS = ["/signin", "/signup", "/forgot"];

/**
 * Route island: mounts the global footer on every non-auth page — sf-062
 * (plan §7; `components/shell-cart.md` §5)
 *
 * Deliberately the thinnest island in the app: no state, no effects, no
 * listener. `Footer` is a server-painted document and the only client fact that
 * matters is *which route we are on*, which `usePathname` already knows. Keeping
 * it `"use client"` is what buys route-awareness without the layout becoming
 * dynamic for the footer's sake.
 *
 * The footer document itself is resolved by the root layout (server), so an
 * outage is decided before hydration and the minimal face is in the HTML — a
 * client-side "is the CMS up?" check would paint a missing footer first.
 */
export default function FooterMount({ footer }: { footer: FooterDocument | null }) {
  const pathname = usePathname();
  if (AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return null;
  }
  return <Footer footer={footer} />;
}
