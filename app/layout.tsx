import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import "./globals.css";
import { resolveNavSettings } from "@/lib/shell/resolveNav";
import { DEMO_NAV_INPUT } from "@/lib/shell/demoNavInput";
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
 * interaction state below. DEMO input until cms-svc lands (one-line swap).
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nav = resolveNavSettings({ settings: DEMO_NAV_INPUT, global: null });
  return (
    <html lang="en" className={`${fraunces.variable} ${outfit.variable}`}>
      <body>
        <NavbarMount nav={nav} />
        {children}
      </body>
    </html>
  );
}
