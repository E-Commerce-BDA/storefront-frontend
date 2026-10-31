import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import "./globals.css";
import { resolveNavSettings } from "@/lib/shell/resolveNav";
import { fetchNavSettings } from "@/lib/cms/navigation";
import NavbarMount from "./_components/NavbarMount";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Storefront Base Components — Oceanic Blue",
  description: "Dumb UI primitives preview for the e-commerce storefront.",
};

/**
 * Root layout — server resolves nav once per request (admin values flow
 * as concrete props; client never sees knob names), NavbarMount owns
 * interaction state below.
 *
 * `fetchNavSettings` never rejects: cms-svc down → stale cache → demo nav.
 * That ordering matters here more than anywhere else, because a throw in the
 * root layout blanks every route in the app.
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { settings } = await fetchNavSettings();
  const nav = resolveNavSettings({ settings, global: null });
  return (
    <html lang="en" className={`${fraunces.variable} ${outfit.variable}`}>
      <body>
        <NavbarMount nav={nav} />
        {children}
      </body>
    </html>
  );
}
