import type { MetadataRoute } from "next";

/** Web app manifest (P15): installable, standalone, brand theme. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FirstEmployer",
    short_name: "FirstEmployer",
    description: "Hire your first employee legally — and stay compliant.",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    background_color: "#F7F4EE", // bone-50
    theme_color: "#0E1B2C", // ink-900
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
