/**
 * Auto-enrolment pension providers (FR-2.4). Content, not JSX.
 * "duties start date" language only — never "staging date" (legacy, pre-2017).
 */
export interface PensionProvider {
  id: string;
  name: string;
  note: string;
  fee: string;
  popular?: boolean;
  url: string;
}

export const PENSION_PROVIDERS: PensionProvider[] = [
  {
    id: "nest",
    name: "NEST",
    note: "Government-backed. Must accept any employer.",
    fee: "No employer charge",
    popular: true,
    url: "https://www.nestpensions.org.uk/",
  },
  {
    id: "peoples",
    name: "People's Partnership",
    note: "Formerly The People's Pension. Widely used.",
    fee: "No employer charge",
    url: "https://thepeoplespension.co.uk/",
  },
  {
    id: "smart",
    name: "Smart Pension",
    note: "App-first, quick online setup.",
    fee: "No employer charge",
    url: "https://www.smartpension.co.uk/",
  },
];
