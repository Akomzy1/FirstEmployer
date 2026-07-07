import type { Metadata, Viewport } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
