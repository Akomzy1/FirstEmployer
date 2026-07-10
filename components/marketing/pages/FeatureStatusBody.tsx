/* Ported from the Claude Design export (binding visual spec — CLAUDE.md Rule 6).
 * Mechanically converted HTML->JSX; links and statutory literals adjusted in
 * follow-up edits (rates render from getLiveConfig — Rule 4). */
/* eslint-disable @next/next/no-img-element, react/no-unescaped-entities */
import type { MarketingVars } from "@/lib/marketing/vars";
export function FeatureStatusBody({ v }: { v: MarketingVars }) {
  return (
    <>
      {/* ============ NAV ============ */}
      <nav className="mk-nav">
        <div className="mk-wrap mk-nav__inner">
          <a className="mk-brand" href="#">
            <span className="mk-brand__seal"><span className="fe-icon fe-icon--fill" style={{ color: "#fff", fontSize: "17px" }}>check</span></span>
            FirstEmployer
          </a>
          <div className="mk-nav__links">
            <a href="#">How it works</a>
            <a href="#" aria-current="page">Features</a>
            <a href="#">Pricing</a>
            <a href="#">For accountants</a>
            <a className="fe-btn fe-btn--primary mk-nav__cta" href="#" style={{ minHeight: "44px", padding: "0 20px", fontSize: "15px" }}>Start free trial</a>
          </div>
        </div>
      </nav>
      
      {/* ============ HERO ============ */}
      <header className="mk-hero">
        <div className="mk-wrap mk-hero__grid">
          <div className="mk-reveal">
            <span className="mk-tag"><span className="fe-icon" style={{ fontSize: "16px" }}>balance</span> Status Advisor</span>
            <h1 className="mk-hero__q">Is this person an employee, a worker, or self‑employed?</h1>
            <p className="mk-hero__promise"><strong>Answer 12 plain-English questions and know for certain</strong> — in about five minutes, with the law it stands on.</p>
            <div className="mk-cta-row">
              <a className="fe-btn fe-btn--primary" href="#">Start free trial</a>
              <a className="fe-btn fe-btn--secondary" href="#">See how it works</a>
            </div>
            <div className="mk-trustline">
              <span><span className="fe-icon">check_circle</span> No card required</span>
              <span><span className="fe-icon">check_circle</span> £{v.launchPrice} a month after</span>
              <span><span className="fe-icon">check_circle</span> Cancel anytime</span>
            </div>
          </div>
      
          {/* hero artefact: determination document */}
          <div className="mk-artefact mk-reveal" style={{ animationDelay: "80ms" }}>
            <div className="mk-artefact__glow"></div>
            <div className="doc mk-artefact__doc">
              <div className="doc__kicker">Employment status determination</div>
              <h3 className="doc__title">Liam Carter</h3>
              <div className="doc__meta fe-tabular">DO Plumbing &amp; Heating Ltd · 4 July 2026</div>
      
              <div className="doc__verdict">
                <span className="doc__verdict-badge">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M6 12.5 10.5 17 18 7.5" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                </span>
                <span>
                  <span className="doc__verdict-label">Determination</span>
                  <span className="doc__verdict-value">Employee</span>
                </span>
              </div>
      
              <div className="doc__row">
                <span style={{ flex: "none", paddingTop: "1px" }}><span className="fe-icon fe-icon--fill" style={{ color: "var(--verified-green-700)", fontSize: "20px" }}>check_circle</span></span>
                <span>
                  <span className="doc__row-name">Must do the work himself</span>
                  <span className="doc__row-detail">He cannot send someone else in his place.</span>
                </span>
              </div>
              <div className="doc__row">
                <span style={{ flex: "none", paddingTop: "1px" }}><span className="fe-icon fe-icon--fill" style={{ color: "var(--verified-green-700)", fontSize: "20px" }}>check_circle</span></span>
                <span>
                  <span className="doc__row-name">You set the hours and the place</span>
                  <span className="doc__row-detail">Day-to-day control points to employment.</span>
                  <span style={{ display: "block", marginTop: "9px" }}>
                    <span className="mk-receipt" data-open="false">
                      <button className="fe-receipt" aria-expanded="false"><span className="fe-icon" style={{ fontSize: "14px" }}>gavel</span> Ready Mixed Concrete 1968</button>
                      <span className="mk-receipt__pop" role="dialog">
                        <span className="mk-receipt__pop-ref">Ready Mixed Concrete v MPNI (1968)</span>
                        <p className="mk-receipt__pop-plain">The landmark case. It says an employer must control the work — telling the person what to do, and when and where to do it.</p>
                        <a href="#">Read the official guidance <span className="fe-icon">open_in_new</span></a>
                      </span>
                    </span>
                  </span>
                </span>
              </div>
      
              <div className="doc__seal-row">
                <span className="doc__stamp fe-tabular">Ref FE-DET-2026-0341<br />Rules engine v2026.2</span>
                <span className="mk-seal" aria-label="Verified determination">
                  <svg className="mk-seal__ring" viewBox="0 0 84 84" fill="none" aria-hidden="true">
                    <circle cx="42" cy="42" r="40" stroke="var(--verified-green-600)" strokeWidth="1.5" strokeDasharray="3 4"></circle>
                    <circle cx="42" cy="42" r="33" stroke="rgba(30,158,106,0.35)" strokeWidth="1"></circle>
                  </svg>
                  <span className="mk-seal__core">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 12.5 10.5 17 18 7.5" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* ============ PROBLEM ============ */}
      <section className="mk-section mk-raised">
        <div className="mk-wrap mk-problem__grid">
          <div>
            <span className="mk-eyebrow">The problem</span>
            <h2 className="mk-h2">Why does getting this one thing wrong cost so much?</h2>
          </div>
          <div className="mk-problem__body">
            <p>Employees, workers and the self-employed each get a different set of rights — and hand you a different set of duties. Call someone self-employed when the law says they are an employee, and you can owe back-taxes, holiday pay and a penalty, years later, with interest.</p>
            <p>Most first-time employers guess, or pay an accountant £500 to decide. <strong>Status Advisor asks you 12 plain questions and gives you a firm answer</strong> — one you can keep, dated, and backed by the exact law it rests on.</p>
            <div className="mk-figure" style={{ marginTop: "28px" }}>
              <div className="mk-figure__num fe-tabular">£{v.rtwPenalty}</div>
              <div className="mk-figure__cap">the penalty HMRC can charge for getting employment status and payroll wrong — the fear Status Advisor is built to remove.</div>
            </div>
          </div>
        </div>
      </section>
      
      {/* ============ CAPABILITY GRID ============ */}
      <section className="mk-section">
        <div className="mk-wrap">
          <span className="mk-eyebrow">What you get</span>
          <h2 className="mk-h2">What does the check actually give you?</h2>
          <p className="mk-lede">No jargon, no guesswork. Every step is written for a nine-year-old to follow, and every answer shows its working.</p>
      
          <div className="mk-cap-grid">
            {/* row 1: two wide */}
            <article className="mk-cap mk-cap--wide mk-cap--accent">
              <div className="mk-cap__icon"><span className="fe-icon">balance</span></div>
              <h3 className="mk-cap__title">A clear verdict — employee, worker, or self-employed</h3>
              <p className="mk-cap__body">You get one plain answer, not a maybe. When the answer is genuinely borderline, we say so honestly rather than guess.</p>
            </article>
            <article className="mk-cap mk-cap--wide">
              <div className="mk-cap__icon"><span className="fe-icon">forum</span></div>
              <h3 className="mk-cap__title">12 plain questions, one at a time</h3>
              <p className="mk-cap__body">No legal words without a translation right next to them. Answer on your phone, on the sofa, in about five minutes. It saves as you go.</p>
            </article>
      
            {/* row 2: three */}
            <article className="mk-cap">
              <div className="mk-cap__icon"><span className="fe-icon">gavel</span></div>
              <h3 className="mk-cap__title">Every answer shows its working</h3>
              <p className="mk-cap__body">Tap the receipt on any point to see the exact law in plain English.</p>
              <div className="mk-cap__foot">
                <span className="mk-receipt" data-open="false">
                  <button className="fe-receipt" aria-expanded="false"><span className="fe-icon" style={{ fontSize: "14px" }}>gavel</span> ERA 1996 s.230</button>
                  <span className="mk-receipt__pop" role="dialog">
                    <span className="mk-receipt__pop-ref">Employment Rights Act 1996, section 230</span>
                    <p className="mk-receipt__pop-plain">The law splits working people into employees and workers. An employee works under a contract of employment and gets the strongest set of rights.</p>
                    <a href="#">Read the official guidance <span className="fe-icon">open_in_new</span></a>
                  </span>
                </span>
              </div>
            </article>
            <article className="mk-cap">
              <div className="mk-cap__icon"><span className="fe-icon">description</span></div>
              <h3 className="mk-cap__title">A dated document you can keep</h3>
              <p className="mk-cap__body">Your determination is saved to your vault — proof of what you decided, and when, if anyone ever asks.</p>
            </article>
            <article className="mk-cap">
              <div className="mk-cap__icon"><span className="fe-icon">front_hand</span></div>
              <h3 className="mk-cap__title">Honest when it is not clear-cut</h3>
              <p className="mk-cap__body">If your answers sit on the line, we tell you plainly and point you to free Acas advice before you go further.</p>
            </article>
          </div>
        </div>
      </section>
      
      {/* ============ JOURNEY BAND ============ */}
      <section className="mk-section mk-raised">
        <div className="mk-wrap">
          <span className="mk-eyebrow">Where this fits</span>
          <h2 className="mk-h2">What comes before, and what comes next?</h2>
      
          <div className="mk-journey__steps">
            <span className="mk-step mk-step--current"><span className="mk-step__dot"></span> Status Advisor</span>
            <span className="mk-step__line"></span>
            <span className="mk-step"><span className="mk-step__dot"></span> Employer setup</span>
            <span className="mk-step__line"></span>
            <span className="mk-step"><span className="mk-step__dot"></span> Contracts</span>
            <span className="mk-step__line"></span>
            <span className="mk-step"><span className="mk-step__dot"></span> Right to work</span>
            <span className="mk-step__line"></span>
            <span className="mk-step"><span className="mk-step__dot"></span> Dashboard</span>
          </div>
      
          <div className="mk-journey__cards">
            <a className="mk-jcard" href="#">
              <span className="mk-jcard__dir"><span className="fe-icon" style={{ fontSize: "16px" }}>arrow_back</span> Before this</span>
              <span className="mk-jcard__title">Getting started</span>
              <span className="mk-jcard__desc">Tell us about your business once. We work out which of the six steps you still need.</span>
            </a>
            <a className="mk-jcard mk-jcard--next" href="/features/contracts">
              <span className="mk-jcard__dir">Next step <span className="fe-icon" style={{ fontSize: "16px" }}>arrow_forward</span></span>
              <span className="mk-jcard__title">Employer setup</span>
              <span className="mk-jcard__desc">Register for PAYE, sort a pension and get employer's liability insurance — guided, in order.</span>
            </a>
          </div>
        </div>
      </section>
      
      {/* ============ FAQ ============ */}
      <section className="mk-section">
        <div className="mk-wrap">
          <div style={{ textAlign: "center" }}>
            <span className="mk-eyebrow" style={{ justifyContent: "center" }}>Common questions</span>
            <h2 className="mk-h2" style={{ marginLeft: "auto", marginRight: "auto", textAlign: "center", maxWidth: "24ch" }}>Still wondering about a few things?</h2>
          </div>
      
          <div className="mk-faq">
            <div className="mk-faq__item" data-open="false">
              <button className="mk-faq__q">What if the answer isn't clear-cut?<span className="fe-icon mk-faq__q-icon">expand_more</span></button>
              <div className="mk-faq__a"><div className="mk-faq__a-inner">
                <p>We would rather be honest than guess. If your answers sit on the line between employee, worker and self-employed, we tell you plainly instead of forcing a verdict. Then we point you to free, confidential advice from the Acas helpline, and record that you were advised to get it.</p>
              </div></div>
            </div>
            <div className="mk-faq__item" data-open="false">
              <button className="mk-faq__q">Is this legal advice?<span className="fe-icon mk-faq__q-icon">expand_more</span></button>
              <div className="mk-faq__a"><div className="mk-faq__a-inner">
                <p>No. Status Advisor applies the same tests a tribunal uses — control, personal service and a two-way promise of work — and shows you the law behind each one. It is a clear, documented starting point, not a substitute for a solicitor on a genuinely difficult case. When a case is that difficult, we say so.</p>
              </div></div>
            </div>
            <div className="mk-faq__item" data-open="false">
              <button className="mk-faq__q">Will HMRC accept the determination?<span className="fe-icon mk-faq__q-icon">expand_more</span></button>
              <div className="mk-faq__a"><div className="mk-faq__a-inner">
                <p>Your determination is a dated record of the answers you gave and the law they point to. It shows you took reasonable care to get status right — which is exactly what HMRC looks for. Keep it in your vault alongside your other documents, ready if anyone asks.</p>
              </div></div>
            </div>
            <div className="mk-faq__item" data-open="false">
              <button className="mk-faq__q">How long does it take?<span className="fe-icon mk-faq__q-icon">expand_more</span></button>
              <div className="mk-faq__a"><div className="mk-faq__a-inner">
                <p>About five minutes. Twelve questions, one at a time, in plain English. You can stop whenever you like — it saves your answers and picks up exactly where you left off.</p>
              </div></div>
            </div>
          </div>
        </div>
      </section>
      
      {/* ============ FINAL CTA ============ */}
      <section className="mk-final">
        <div className="mk-wrap mk-final__inner">
          <h2 className="mk-final__h">Know exactly who you're hiring — before you hire them.</h2>
          <p className="mk-final__p">Start with the status check. It is free to try, and it decides everything that comes after.</p>
          <a className="fe-btn fe-btn--primary" href="#" style={{ fontSize: "18px", minHeight: "56px", padding: "0 34px" }}>Start free trial</a>
          <div className="mk-trustline" style={{ justifyContent: "center" }}>
            <span><span className="fe-icon">check_circle</span> No card required</span>
            <span><span className="fe-icon">check_circle</span> £{v.launchPrice} a month, not £2,000</span>
          </div>
        </div>
      </section>
      
      {/* ============ FOOTER ============ */}
      <footer className="mk-footer">
        <div className="mk-wrap mk-footer__inner">
          <span>© 2026 FirstEmployer · Get to green.</span>
          <span className="mk-footer__links">
            <a href="#">How it works</a>
            <a href="#">Pricing</a>
            <a href="#">Trust &amp; security</a>
            <a href="#">Contact</a>
          </span>
        </div>
      </footer>
    </>
  );
}
