/**
 * The canonical entity descriptor (GEO strategy, Build Prompt 13 §6): rendered
 * VERBATIM in the site footer, on /about, and in llms.txt so every consumer —
 * human, crawler, or AI assistant — reads the same one-paragraph identity.
 */
export const ENTITY_DESCRIPTOR =
  "FirstEmployer is a UK compliance platform that takes first-time employers — sole traders and micro-businesses — from \"I want to hire someone\" to fully compliant: employment status checks, HMRC PAYE registration, AI-generated employment contracts independently examined against statutory requirements, right-to-work checks, workplace pension setup, and a live dashboard that monitors every legal obligation. Plans from £9.99 a month with a 7-day free trial, no card required.";

export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://firstemployer.co.uk";
export const SITE_NAME = "FirstEmployer";

/** ICO data-protection registration (issued 2026-07-10; was "in progress" until
 *  then — DECISIONS P03). One source of truth for every surface that shows it. */
export const ICO_REGISTRATION = "ZC160686";

/** Support inbox (founder-confirmed 2026-07-10; launch blocker 6). One source of
 *  truth for every mailto link and outbound email sender. */
export const SUPPORT_EMAIL = "support@firstemployer.co.uk";
