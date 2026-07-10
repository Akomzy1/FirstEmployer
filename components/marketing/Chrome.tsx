/* Marketing nav + footer, ported from the Homepage export (Rule 6). Links are
 * wired to real routes; the fake ICO number is omitted until registration is
 * live (DECISIONS P03); the footer carries the canonical entity descriptor. */
import Link from "next/link";
import { ENTITY_DESCRIPTOR } from "@/lib/marketing/entity";

export function MarketingNav() {
  return (
    <nav className="nav">
      <div className="wrap nav__inner">
        <Link className="brand" href="/">
          <span className="brand__mark"><span className="fe-icon fe-icon--fill">verified</span></span>
          FirstEmployer
        </Link>
        <div className="nav__links">
          <Link href="/#journey">How it works</Link>
          <Link href="/features/contracts">The Examiner</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/guides">Guides</Link>
        </div>
        <div className="nav__right">
          <Link className="nav__signin" href="/auth">Sign in</Link>
          <Link className="fe-btn fe-btn--primary fe-btn--sm" href="/readiness">Check readiness</Link>
        </div>
      </div>
    </nav>
  );
}

export function MarketingFooter({ configLabel }: { configLabel: string }) {
  return (
    <footer className="foot">
      <div className="wrap">
        <div className="foot__grid">
          <div className="foot__brand">
            <Link className="brand" href="/">
              <span className="brand__mark"><span className="fe-icon fe-icon--fill">verified</span></span>
              FirstEmployer
            </Link>
            {/* Canonical entity descriptor — identical here, on /about, and in llms.txt (GEO). */}
            <p>{ENTITY_DESCRIPTOR}</p>
          </div>
          <div className="foot__col">
            <h5>Product</h5>
            <ul>
              <li><Link href="/#journey">How it works</Link></li>
              <li><Link href="/features/contracts">The Examiner</Link></li>
              <li><Link href="/pricing">Pricing</Link></li>
              <li><Link href="/readiness">Readiness check</Link></li>
              <li><Link href="/calculator">Cost calculator</Link></li>
            </ul>
          </div>
          <div className="foot__col">
            <h5>Company</h5>
            <ul>
              <li><Link href="/about">About</Link></li>
              <li><Link href="/trust">Trust &amp; security</Link></li>
              <li><Link href="/guides">Guides</Link></li>
              <li><a href="mailto:hello@firstemployer.co.uk">Contact</a></li>
            </ul>
          </div>
          <div className="foot__news">
            <span className="fe-tabular" style={{ font: "600 13px/1.4 var(--font-body)", color: "var(--neutral-500)" }}>
              Rates current as of config {configLabel}. Statutory figures on this site come from our live statutory configuration, never from copy.
            </span>
          </div>
        </div>
        <div className="foot__legal">
          <span>© 2026 FirstEmployer Ltd</span>
          <span className="sep">·</span>
          <span>ICO registration in progress</span>
          <span className="sep">·</span>
          <span>Guidance, not legal advice</span>
        </div>
      </div>
    </footer>
  );
}
