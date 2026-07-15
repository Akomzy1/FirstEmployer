import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { MetaPixel } from "@/components/marketing/MetaPixel";

export const metadata: Metadata = {
  title: {
    default: "FirstEmployer — Hire your first employee without the fear",
    template: "%s · FirstEmployer",
  },
  description:
    "We tell you what to do, when to do it, and why the law asks for it. Employment status, HMRC, contracts, pensions and right-to-work — all in one guided journey.",
};

export const viewport: Viewport = {
  themeColor: "#0E1B2C",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB">
      <head>
        {/* Body + heading fonts preloaded to shrink the swap window (CLS).
            The 3MB icon font is deliberately NOT preloaded — it would delay
            LCP; font-display: block covers it instead. */}
        <link rel="preload" href="/fonts/Inter-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/GeneralSans-Semibold.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body>
        {children}
        <ServiceWorkerRegister />
        <MetaPixel />
      </body>
    </html>
  );
}
