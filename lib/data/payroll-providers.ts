/**
 * Payroll software options (FR-2.3) — content, not JSX. All are HMRC-recognised.
 * Prices are third-party commercial values (not statutory), kept here as data.
 * `recommended` drives the "Our pick" badge; referral links are disclosed in UI.
 */
export interface PayrollProvider {
  id: string;
  name: string;
  price: string;
  priceNote: string;
  bestFor: string;
  hmrcRecognised: boolean;
  recommended?: boolean;
  points: string[];
  /** Tagged referral URL (disclosed to the user per FR-2.3). */
  referralUrl: string;
}

export const PAYROLL_PROVIDERS: PayrollProvider[] = [
  {
    id: "brightpay",
    name: "BrightPay",
    price: "£99 / year",
    priceNote: "one company, up to 3 employees",
    bestFor: "Best for most first-time employers — the clearest to use.",
    hmrcRecognised: true,
    recommended: true,
    points: ["Guided first payroll run", "Auto-enrolment built in", "Free UK phone support"],
    referralUrl: "https://www.brightpay.co.uk/?ref=firstemployer",
  },
  {
    id: "moneysoft",
    name: "Moneysoft Payroll Manager",
    price: "£72 / year",
    priceNote: "up to 20 employees",
    bestFor: "Best if you'd rather pay less and don't mind a plainer screen.",
    hmrcRecognised: true,
    points: ["Low yearly price", "Handles pensions", "Desktop software (Windows)"],
    referralUrl: "https://www.moneysoft.co.uk/?ref=firstemployer",
  },
  {
    id: "hmrc_basic",
    name: "HMRC Basic PAYE Tools",
    price: "Free",
    priceNote: "from HMRC directly",
    bestFor: "Best only if you're comfortable doing more by hand.",
    hmrcRecognised: true,
    points: ["No cost", "No payslips — you make your own", "No auto-enrolment help"],
    referralUrl: "https://www.gov.uk/basic-paye-tools",
  },
];

export const PAYROLL_REFERRAL_DISCLOSURE = {
  title: "We earn a referral fee from some providers",
  body: "It never changes what we recommend. Our pick is the one we'd choose for a business like yours — the fee has no say in it.",
};
