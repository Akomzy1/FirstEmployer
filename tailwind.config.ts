import type { Config } from "tailwindcss";

/**
 * Design tokens extracted from /design/prototype/Style Reference (standalone).html.
 * The CSS custom properties in app/globals.css are the single source of the hex
 * values; Tailwind utilities reference them so the two can never drift.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: { 900: "var(--ink-900)" },
        bone: { 50: "var(--bone-50)" },
        "verified-green": {
          50: "var(--verified-green-50)",
          600: "var(--verified-green-600)",
          700: "var(--verified-green-700)",
        },
        amber: {
          50: "var(--amber-50)",
          500: "var(--amber-500)",
          700: "var(--amber-700)",
        },
        urgent: { 50: "var(--urgent-50)", 600: "var(--urgent-600)" },
        red: {
          50: "var(--red-50)",
          600: "var(--red-600)",
          700: "var(--red-700)",
        },
        terracotta: {
          50: "var(--terracotta-50)",
          500: "var(--terracotta-500)",
        },
        neutral: {
          100: "var(--neutral-100)",
          200: "var(--neutral-200)",
          400: "var(--neutral-400)",
          500: "var(--neutral-500)",
          700: "var(--neutral-700)",
        },
        surface: { DEFAULT: "var(--surface)", raised: "var(--surface-raised)" },
      },
      fontFamily: {
        display: ["General Sans", "Inter", "-apple-system", "sans-serif"],
        body: ["Inter", "-apple-system", "Segoe UI", "sans-serif"],
      },
      borderRadius: {
        pill: "999px",
        card: "12px",
        input: "10px",
        popover: "12px",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        document: "var(--shadow-document)",
        popover: "var(--shadow-popover)",
      },
      transitionTimingFunction: {
        fe: "cubic-bezier(0.25, 0.1, 0.25, 1)",
      },
      transitionDuration: {
        fast: "150ms",
        base: "200ms",
        slow: "250ms",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
