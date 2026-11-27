import type { Metadata } from "next";
import AccountView from "../_components/AccountView";
import { parseAccountTab } from "@/lib/account/machine";

/**
 * `/account` — a static shell over `GET /api/account` (plan §8; decision 4).
 * Private per-session data like `/cart` and `/checkout`; the proxy already
 * keeps a signed-out shopper off this route, so the island only ever renders
 * for a session (a mid-read expiry still gets the island's 401 → `/signin`
 * path). The island owns its header — the title is the shopper's name, which
 * a server shell cannot know without making the page dynamic.
 */

export const metadata: Metadata = {
  title: "Account",
  robots: { index: false, follow: false },
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.tab) ? sp.tab[0] : sp.tab;
  return <AccountView tab={parseAccountTab(raw)} />;
}
