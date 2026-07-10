/* Ported from the Claude Design export (binding visual spec — CLAUDE.md Rule 6).
 * Mechanically converted HTML->JSX; links and statutory literals adjusted in
 * follow-up edits (rates render from getLiveConfig — Rule 4). */
/* eslint-disable @next/next/no-img-element, react/no-unescaped-entities */
import type { MarketingVars } from "@/lib/marketing/vars";
export function FeatureContractsBody({ v }: { v: MarketingVars }) {
  return (
    <>
      {/* ============ NAV ============ */}
      <nav className="mk-nav">
        <div className="mk-wrap mk-nav__inner">
          <a className="mk-brand" href="/features/status-advisor">
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
            <span className="mk-tag"><span className="fe-icon" style={{ fontSize: "16px" }}>contract</span> Contracts</span>
            <h1 className="mk-hero__q">Is a ChatGPT contract actually legal?</h1>
            <p className="mk-hero__promise"><strong>We draft your contract, then a second AI checks it against the law</strong> — clause by clause — before it ever reaches you.</p>
            <div className="mk-cta-row">
              <a className="fe-btn fe-btn--primary" href="#">Start free trial</a>
              <a className="fe-btn fe-btn--secondary" href="#">See a sample report</a>
            </div>
            <div className="mk-trustline">
              <span><span className="fe-icon">check_circle</span> 13 statutory checks</span>
              <span><span className="fe-icon">check_circle</span> Independently examined</span>
              <span><span className="fe-icon">check_circle</span> No card required</span>
            </div>
          </div>
      
          {/* hero artefact: examiner report */}
          <div className="mk-artefact mk-reveal" style={{ animationDelay: "80ms" }}>
            <div className="mk-artefact__glow"></div>
            <div className="doc mk-artefact__doc">
              <div className="doc__kicker">Examiner report</div>
              <h3 className="doc__title">Liam Carter — employment contract</h3>
              <div className="doc__meta fe-tabular">Examiner v2.4.1 · 14:32 · 3 Jul 2026</div>
      
              <div className="rep__banner" style={{ marginTop: "16px" }}>
                <span className="rep__banner-badge">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 12.5 10.5 17 18 7.5" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                </span>
                <span>
                  <span className="rep__banner-label">Verdict</span>
                  <span className="rep__banner-verdict">Approved</span>
                </span>
              </div>
      
              <div className="rep__checks">
                <div className="rep__check">
                  <span className="rep__check-tick"><span className="fe-icon fe-icon--fill" style={{ color: "var(--verified-green-700)", fontSize: "20px" }}>check_circle</span></span>
                  <span><span className="rep__check-name">Pay is at or above the legal minimum</span><span className="rep__check-detail fe-tabular">£10.20/hr — above the minimum for age 19.</span></span>
                </div>
                <div className="rep__check">
                  <span className="rep__check-tick"><span className="fe-icon fe-icon--fill" style={{ color: "var(--verified-green-700)", fontSize: "20px" }}>check_circle</span></span>
                  <span><span className="rep__check-name">Holiday meets the 5.6-week minimum</span><span className="rep__check-detail fe-tabular">28 days a year, including bank holidays.</span></span>
                </div>
              </div>
      
              <div className="rep__foot">
                <span className="doc__stamp fe-tabular">All 13 checks passed<br />Ref FE-EXM-7f3a91</span>
                <span className="mk-seal" aria-label="Verified by the Examiner">
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
            <h2 className="mk-h2">Why isn't a free template good enough?</h2>
          </div>
          <div className="mk-problem__body">
            <p>A template — or a contract from a chatbot — looks the part. But it can quietly miss a legal must: the wrong notice period, no written pay rate, a holiday clause below the minimum. You would not know until it mattered, in a tribunal, with the burden on you to prove you got it right.</p>
            <p>The law says every employee must get a written statement of their main terms. <strong>We draft yours from your answers, then a separate AI examines all 13 required points</strong> — and only sends it to you once every one passes.</p>
            <div className="mk-figure" style={{ marginTop: "28px" }}>
              <div className="mk-figure__num fe-tabular">13</div>
              <div className="mk-figure__cap">statutory points every written statement must cover under ERA 1996. We check all of them, every time, before you see the document.</div>
            </div>
          </div>
        </div>
      </section>
      
      {/* ============ CAPABILITY GRID ============ */}
      <section className="mk-section">
        <div className="mk-wrap">
          <span className="mk-eyebrow">What you get</span>
          <h2 className="mk-h2">What does the Contracts module do?</h2>
          <p className="mk-lede">Draft, check and keep a legally sound contract — without a solicitor, and without hoping a template got it right.</p>
      
          <div className="mk-cap-grid">
            <article className="mk-cap mk-cap--wide mk-cap--accent">
              <div className="mk-cap__icon"><span className="fe-icon">draft</span></div>
              <h3 className="mk-cap__title">Your contract, drafted from your answers</h3>
              <p className="mk-cap__body">No blank page, no legal words to look up. Answer plain questions about the job and pay, and we write the contract for you.</p>
            </article>
            <article className="mk-cap mk-cap--wide">
              <div className="mk-cap__icon"><span className="fe-icon">fact_check</span></div>
              <h3 className="mk-cap__title">Checked against 13 statutory points</h3>
              <p className="mk-cap__body">A separate, independent Examiner reads the finished contract and tests every legal requirement — before it reaches you.</p>
            </article>
      
            <article className="mk-cap">
              <div className="mk-cap__icon"><span className="fe-icon">gavel</span></div>
              <h3 className="mk-cap__title">Every clause tied to the law</h3>
              <p className="mk-cap__body">Tap any receipt to read the exact statute in plain English.</p>
              <div className="mk-cap__foot">
                <span className="mk-receipt" data-open="false">
                  <button className="fe-receipt" aria-expanded="false"><span className="fe-icon" style={{ fontSize: "14px" }}>gavel</span> ERA 1996 s.1</button>
                  <span className="mk-receipt__pop" role="dialog">
                    <span className="mk-receipt__pop-ref">Employment Rights Act 1996, section 1</span>
                    <p className="mk-receipt__pop-plain">Every employee must be given a written statement of their main terms — names, pay, hours, holiday and more — on or before their first day.</p>
                    <a href="#">Read the official guidance <span className="fe-icon">open_in_new</span></a>
                  </span>
                </span>
              </div>
            </article>
            <article className="mk-cap">
              <div className="mk-cap__icon"><span className="fe-icon">verified</span></div>
              <h3 className="mk-cap__title">A real document, with a seal</h3>
              <p className="mk-cap__body">You get a proper, dated contract in your vault — carrying the Examiner's seal, timestamp and reference.</p>
            </article>
            <article className="mk-cap">
              <div className="mk-cap__icon"><span className="fe-icon">notifications_active</span></div>
              <h3 className="mk-cap__title">We tell you when the law changes</h3>
              <p className="mk-cap__body">If a rule that affects your contract changes, we flag it and show you what to update.</p>
            </article>
          </div>
        </div>
      </section>
      
      {/* ============ EXAMINER REPORT ANATOMY (Contracts only) ============ */}
      <section className="mk-section mk-raised">
        <div className="mk-wrap">
          <div style={{ maxWidth: "760px" }}>
            <span className="mk-eyebrow">Anatomy of a report</span>
            <h2 className="mk-h2">Is a ChatGPT contract actually legal? Here's the difference.</h2>
            <p className="mk-lede">A chatbot hands you a document and hopes. We hand you a document and a report that proves it — here is what every Examiner report shows.</p>
          </div>
      
          <div className="mk-anatomy__grid" data-anatomy="">
            <svg className="mk-anno__svg" aria-hidden="true"></svg>
      
            {/* LEFT labels */}
            <div className="mk-anatomy__col">
              <div className="mk-anno" data-target="#an-verdict" data-side="left">
                <div className="mk-anno__label"><span className="fe-icon">balance</span> The verdict</div>
                <div className="mk-anno__text">Pass or fail, in one word. If it fails, this document never reaches you — you only ever see approved contracts.</div>
              </div>
              <div className="mk-anno" data-target="#an-check" data-side="left">
                <div className="mk-anno__label"><span className="fe-icon">check</span> A statutory check</div>
                <div className="mk-anno__text">One legal must, in plain English, with what the contract actually says next to it. There are 13 in all.</div>
              </div>
            </div>
      
            {/* CENTRE: the report artefact */}
            <div className="doc mk-anatomy__doc">
              <div className="doc__kicker">Examiner report</div>
              <h3 className="doc__title">Liam Carter — employment contract</h3>
              <div className="doc__meta fe-tabular">Examiner v2.4.1 · 3 Jul 2026</div>
      
              <div className="rep__banner" id="an-verdict" style={{ marginTop: "16px" }}>
                <span className="rep__banner-badge">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 12.5 10.5 17 18 7.5" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                </span>
                <span>
                  <span className="rep__banner-label">Verdict · 13 of 13 passed</span>
                  <span className="rep__banner-verdict">Approved</span>
                </span>
              </div>
      
              <div className="rep__checks">
                <div className="rep__check" id="an-check" style={{ justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ display: "flex", gap: "11px", alignItems: "flex-start", minWidth: "0" }}>
                    <span className="rep__check-tick"><span className="fe-icon fe-icon--fill" style={{ color: "var(--verified-green-700)", fontSize: "20px" }}>check_circle</span></span>
                    <span><span className="rep__check-name">Pay at or above the legal minimum</span><span className="rep__check-detail fe-tabular">£10.20/hr — above age-19 rate.</span></span>
                  </span>
                  <span className="mk-receipt" id="an-receipt" data-open="false" style={{ flex: "none" }}>
                    <button className="fe-receipt" aria-expanded="false"><span className="fe-icon" style={{ fontSize: "13px" }}>gavel</span> NMWA 1998</button>
                    <span className="mk-receipt__pop" role="dialog" style={{ left: "auto", right: "0" }}>
                      <span className="mk-receipt__pop-ref">National Minimum Wage Act 1998, section 1</span>
                      <p className="mk-receipt__pop-plain">Everyone must be paid at least the National Minimum Wage for their age. Liam's rate is above his.</p>
                      <a href="#">Read the official guidance <span className="fe-icon">open_in_new</span></a>
                    </span>
                  </span>
                </div>
                <div className="rep__check">
                  <span className="rep__check-tick"><span className="fe-icon fe-icon--fill" style={{ color: "var(--verified-green-700)", fontSize: "20px" }}>check_circle</span></span>
                  <span><span className="rep__check-name">Notice periods meet the legal floor</span><span className="rep__check-detail">One week either way — both clauses agree.</span></span>
                </div>
              </div>
      
              <div className="rep__foot">
                <span className="doc__stamp fe-tabular">Ref FE-EXM-7f3a91<br />14:32 · 3 Jul 2026</span>
                <span className="mk-seal" id="an-seal" aria-label="Examiner seal">
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
      
            {/* RIGHT labels */}
            <div className="mk-anatomy__col">
              <div className="mk-anno mk-anno--right" data-target="#an-receipt" data-side="right">
                <div className="mk-anno__label">The statutory receipt <span className="fe-icon">receipt_long</span></div>
                <div className="mk-anno__text">The exact law behind the check. Tap it to read the statute in plain English, or open the official guidance.</div>
              </div>
              <div className="mk-anno mk-anno--right" data-target="#an-seal" data-side="right">
                <div className="mk-anno__label">The seal <span className="fe-icon">verified</span></div>
                <div className="mk-anno__text">Who checked it, when, and a reference you can quote. Proof this contract was examined — not just written.</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* ============ TWO AIs (Contracts only) ============ */}
      <section className="mk-section">
        <div className="mk-wrap">
          <div style={{ maxWidth: "720px" }}>
            <span className="mk-eyebrow">How it works</span>
            <h2 className="mk-h2">Why are two AIs safer than one?</h2>
          </div>
      
          <div className="mk-flow">
            <div className="mk-flow__node">
              <span className="mk-flow__node-ic"><span className="fe-icon">edit_document</span></span>
              <span className="mk-flow__node-name">Generator</span>
              <span className="mk-flow__node-sub">Writes the contract from your answers</span>
            </div>
            <div className="mk-flow__arrow"><span className="fe-icon">arrow_forward</span></div>
            <div className="mk-flow__node">
              <span className="mk-flow__node-ic"><span className="fe-icon">description</span></span>
              <span className="mk-flow__node-name">The document</span>
              <span className="mk-flow__node-sub">A full draft contract</span>
            </div>
            <div className="mk-flow__arrow"><span className="fe-icon">arrow_forward</span></div>
            <div className="mk-flow__node mk-flow__node--examiner">
              <span className="mk-flow__node-ic"><span className="fe-icon">balance</span></span>
              <span className="mk-flow__node-name">Independent Examiner</span>
              <span className="mk-flow__node-sub">Its own instructions · cannot see the writer's thinking</span>
            </div>
            <div className="mk-flow__arrow"><span className="fe-icon">arrow_forward</span></div>
            <div className="mk-flow__node mk-flow__node--gate">
              <span className="mk-flow__node-ic"><span className="fe-icon">verified_user</span></span>
              <span className="mk-flow__node-name">Pass or fail</span>
              <span className="mk-flow__node-sub">Fails go back. Only a pass gets through</span>
            </div>
            <div className="mk-flow__arrow"><span className="fe-icon">arrow_forward</span></div>
            <div className="mk-flow__node">
              <span className="mk-flow__node-ic"><span className="fe-icon">person</span></span>
              <span className="mk-flow__node-name">You</span>
              <span className="mk-flow__node-sub">Get only checked, approved contracts</span>
            </div>
          </div>
      
          <p className="mk-flow__cap">One AI writes the contract. A <strong>second, separate AI marks it</strong> — with its own rules, and no idea what the first one was thinking. Just like a second person checking your work, it catches mistakes the writer would miss. If the contract fails, it goes back to be fixed. You only ever see the version that passed.</p>
        </div>
      </section>
      
      {/* ============ DOCUMENT-SET LIST (Contracts only) ============ */}
      <section className="mk-section mk-raised mk-section--tight">
        <div className="mk-wrap">
          <span className="mk-eyebrow">The document set</span>
          <h2 className="mk-h2">What can you actually create?</h2>
          <p className="mk-lede">Everything your first hire needs on day one — each one examined the same way.</p>
      
          <div className="mk-docset">
            <div className="mk-doc-item">
              <span className="mk-doc-item__ic"><span className="fe-icon">contract</span></span>
              <span className="mk-doc-item__name">Employment contract</span>
              <span className="mk-doc-item__foot"><span className="fe-pill fe-status--complete"><span className="fe-icon" style={{ fontSize: "15px" }}>check</span> Live now</span></span>
            </div>
            <div className="mk-doc-item">
              <span className="mk-doc-item__ic"><span className="fe-icon">mail</span></span>
              <span className="mk-doc-item__name">Offer letter</span>
              <span className="mk-doc-item__foot"><span className="fe-pill fe-status--complete"><span className="fe-icon" style={{ fontSize: "15px" }}>check</span> Live now</span></span>
            </div>
            <div className="mk-doc-item">
              <span className="mk-doc-item__ic"><span className="fe-icon">checklist</span></span>
              <span className="mk-doc-item__name">New starter checklist</span>
              <span className="mk-doc-item__foot"><span className="fe-pill fe-status--complete"><span className="fe-icon" style={{ fontSize: "15px" }}>check</span> Live now</span></span>
            </div>
            <div className="mk-doc-item mk-doc-item--soon">
              <span className="mk-doc-item__ic"><span className="fe-icon">menu_book</span></span>
              <span className="mk-doc-item__name">Staff handbook</span>
              <span className="mk-doc-item__foot"><span className="fe-pill fe-deadline--approaching"><span className="fe-icon" style={{ fontSize: "15px" }}>schedule</span> Coming · months 4–9</span></span>
            </div>
          </div>
        </div>
      </section>
      
      {/* ============ JOURNEY BAND ============ */}
      <section className="mk-section">
        <div className="mk-wrap">
          <span className="mk-eyebrow">Where this fits</span>
          <h2 className="mk-h2">What comes before, and what comes next?</h2>
      
          <div className="mk-journey__steps">
            <span className="mk-step mk-step--done"><span className="mk-step__dot"></span> Status Advisor</span>
            <span className="mk-step__line"></span>
            <span className="mk-step mk-step--done"><span className="mk-step__dot"></span> Employer setup</span>
            <span className="mk-step__line"></span>
            <span className="mk-step mk-step--current"><span className="mk-step__dot"></span> Contracts</span>
            <span className="mk-step__line"></span>
            <span className="mk-step"><span className="mk-step__dot"></span> Right to work</span>
            <span className="mk-step__line"></span>
            <span className="mk-step"><span className="mk-step__dot"></span> Dashboard</span>
          </div>
      
          <div className="mk-journey__cards">
            <a className="mk-jcard" href="#">
              <span className="mk-jcard__dir"><span className="fe-icon" style={{ fontSize: "16px" }}>arrow_back</span> Before this</span>
              <span className="mk-jcard__title">Employer setup</span>
              <span className="mk-jcard__desc">PAYE, pension and insurance sorted — so your contract can name real, registered terms.</span>
            </a>
            <a className="mk-jcard mk-jcard--next" href="/features/status-advisor">
              <span className="mk-jcard__dir">Next step <span className="fe-icon" style={{ fontSize: "16px" }}>arrow_forward</span></span>
              <span className="mk-jcard__title">Right to work</span>
              <span className="mk-jcard__desc">Check your new hire can legally work in the UK — a photo, a few taps, a dated record.</span>
            </a>
          </div>
        </div>
      </section>
      
      {/* ============ FAQ ============ */}
      <section className="mk-section mk-raised">
        <div className="mk-wrap">
          <div style={{ textAlign: "center" }}>
            <span className="mk-eyebrow" style={{ justifyContent: "center" }}>Common questions</span>
            <h2 className="mk-h2" style={{ marginLeft: "auto", marginRight: "auto", textAlign: "center", maxWidth: "24ch" }}>Still wondering about a few things?</h2>
          </div>
      
          <div className="mk-faq">
            <div className="mk-faq__item" data-open="false">
              <button className="mk-faq__q">Is a ChatGPT contract actually legal?<span className="fe-icon mk-faq__q-icon">expand_more</span></button>
              <div className="mk-faq__a"><div className="mk-faq__a-inner">
                <p>It might be — or it might quietly miss a legal must, and you would not know until it mattered. A chatbot gives you a document and no proof it is right. We give you a document and a report showing all 13 required points were checked and passed.</p>
              </div></div>
            </div>
            <div className="mk-faq__item" data-open="false">
              <button className="mk-faq__q">What is the Examiner, exactly?<span className="fe-icon mk-faq__q-icon">expand_more</span></button>
              <div className="mk-faq__a"><div className="mk-faq__a-inner">
                <p>A second, separate AI whose only job is to check the contract against the law. It has its own instructions and cannot see how the first AI wrote the document — so it marks the work fresh, like an independent second pair of eyes. If it finds a problem, the contract goes back to be fixed before you ever see it.</p>
              </div></div>
            </div>
            <div className="mk-faq__item" data-open="false">
              <button className="mk-faq__q">What if a contract fails the checks?<span className="fe-icon mk-faq__q-icon">expand_more</span></button>
              <div className="mk-faq__a"><div className="mk-faq__a-inner">
                <p>You never see a failed contract. It is sent back, corrected, and examined again — and only the version that passes all 13 checks reaches you. The report keeps an honest record of what was fixed, so you can see the working if you want to.</p>
              </div></div>
            </div>
            <div className="mk-faq__item" data-open="false">
              <button className="mk-faq__q">What happens when the law changes?<span className="fe-icon mk-faq__q-icon">expand_more</span></button>
              <div className="mk-faq__a"><div className="mk-faq__a-inner">
                <p>We watch the rules that affect your documents. If one changes — a new minimum wage, a change to notice periods — we flag it on your dashboard and show you exactly what to update, in plain English.</p>
              </div></div>
            </div>
          </div>
        </div>
      </section>
      
      {/* ============ FINAL CTA ============ */}
      <section className="mk-final">
        <div className="mk-wrap mk-final__inner">
          <h2 className="mk-final__h">Give your first hire a contract that holds up.</h2>
          <p className="mk-final__p">Draft it, have it examined, and keep it — for a fraction of a solicitor's fee.</p>
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
