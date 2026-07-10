/* Ported from the Claude Design export (binding visual spec — CLAUDE.md Rule 6).
 * Mechanically converted HTML->JSX; links and statutory literals adjusted in
 * follow-up edits (rates render from getLiveConfig — Rule 4). */
/* eslint-disable @next/next/no-img-element, react/no-unescaped-entities */
import type { MarketingVars } from "@/lib/marketing/vars";
export function TrustBody({ v }: { v: MarketingVars }) {
  return (
    <>
      {/* ============ NAV ============ */}
      <nav className="mk-nav">
        <div className="mk-wrap mk-nav__inner">
          <a className="mk-brand" href="/">
            <span className="mk-brand__seal"><span className="fe-icon fe-icon--fill" style={{ color: "#fff", fontSize: "17px" }}>check</span></span>
            FirstEmployer
          </a>
          <div className="mk-nav__links">
            <a href="/">How it works</a>
            <a href="/pricing">Pricing</a>
            <a href="/trust" aria-current="page">Trust</a>
            <a href="/about">About</a>
            <a className="fe-btn fe-btn--primary mk-nav__cta" href="#" style={{ minHeight: "44px", padding: "0 20px", fontSize: "15px" }}>Start free trial</a>
          </div>
        </div>
      </nav>
      
      {/* ============ HERO ============ */}
      <header className="tr-hero mk-wrap">
        <span className="mk-eyebrow" style={{ display: "inline-flex", marginLeft: "auto", marginRight: "auto" }}><span className="fe-icon" style={{ fontSize: "16px" }}>shield</span> Trust &amp; security</span>
        <h1>Why you can rely on what we tell you.</h1>
        <p className="tr-hero__sub">Every document is checked by an independent Examiner before it reaches you. Here's exactly how that works, the 13 statutory checks in full, and how we keep your data safe — with nothing hidden.</p>
        <div className="mk-trustline">
          <span><span className="fe-icon">check_circle</span> Independently examined</span>
          <span><span className="fe-icon">check_circle</span> UK-region hosting</span>
          <span><span className="fe-icon">check_circle</span> ICO registered</span>
        </div>
      </header>
      
      {/* ============ HOW THE EXAMINER WORKS ============ */}
      <section className="mk-section mk-raised">
        <div className="mk-wrap">
          <div style={{ maxWidth: "720px" }}>
            <span className="mk-eyebrow"><span className="fe-icon" style={{ fontSize: "16px" }}>balance</span> How the Examiner works</span>
            <h2 className="mk-h2">One AI writes it. A second, independent AI checks it.</h2>
            <p className="mk-lede">A single AI can be confidently wrong. So nothing it writes reaches you unchecked — a separate Examiner, with its own instructions, has to pass it first.</p>
          </div>
      
          <div className="mk-flow">
            <div className="mk-flow__node">
              <span className="mk-flow__node-ic"><span className="fe-icon">edit_document</span></span>
              <span className="mk-flow__node-name">Generator</span>
              <span className="mk-flow__node-sub">Writes the document from your answers</span>
            </div>
            <div className="mk-flow__arrow"><span className="fe-icon">arrow_forward</span></div>
            <div className="mk-flow__node">
              <span className="mk-flow__node-ic"><span className="fe-icon">description</span></span>
              <span className="mk-flow__node-name">The document</span>
              <span className="mk-flow__node-sub">A full draft, not yet seen by you</span>
            </div>
            <div className="mk-flow__arrow"><span className="fe-icon">arrow_forward</span></div>
            <div className="mk-flow__node mk-flow__node--examiner">
              <span className="mk-flow__node-ic"><span className="fe-icon">balance</span></span>
              <span className="mk-flow__node-name">Independent Examiner</span>
              <span className="mk-flow__node-sub">Its own rules · cannot see the writer's thinking</span>
            </div>
            <div className="mk-flow__arrow"><span className="fe-icon">arrow_forward</span></div>
            <div className="mk-flow__node mk-flow__node--gate">
              <span className="mk-flow__node-ic"><span className="fe-icon">verified_user</span></span>
              <span className="mk-flow__node-name">Pass or fail</span>
              <span className="mk-flow__node-sub">A fail goes back. Only a pass gets through</span>
            </div>
            <div className="mk-flow__arrow"><span className="fe-icon">arrow_forward</span></div>
            <div className="mk-flow__node">
              <span className="mk-flow__node-ic"><span className="fe-icon">person</span></span>
              <span className="mk-flow__node-name">You</span>
              <span className="mk-flow__node-sub">Only ever see checked, approved documents</span>
            </div>
          </div>
      
          {/* fail-closed principle */}
          <div className="tr-failsafe">
            <span className="tr-failsafe__badge"><span className="fe-icon">gpp_good</span></span>
            <div>
              <p className="tr-failsafe__label">The fail-closed principle</p>
              <p className="tr-failsafe__q">If a document fails examination, it never reaches you. The system fails <em>safe</em>, not <em>silent</em> — you're told what went wrong and it's fixed before you ever see it.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* ============ 13 STATUTORY CHECKS ============ */}
      <section className="mk-section">
        <div className="mk-wrap">
          <div style={{ maxWidth: "720px" }}>
            <span className="mk-eyebrow"><span className="fe-icon" style={{ fontSize: "16px" }}>fact_check</span> The 13 statutory checks</span>
            <h2 className="mk-h2">Every check, in full — with the law behind it.</h2>
            <p className="mk-lede">Each employment contract is tested against all 13 before it's approved. Tap any receipt to read the statute in plain English.</p>
          </div>
      
          <div className="tr-checks">
      
            <div className="tr-check">
              <span className="tr-check__n fe-tabular">1</span>
              <div className="tr-check__body">
                <p className="tr-check__name">Names of the employer and the employee</p>
                <span className="mk-receipt" data-open="false">
                  <button className="fe-receipt" aria-expanded="false"><span className="fe-icon" style={{ fontSize: "13px" }}>gavel</span> ERA 1996 s.1(3)</button>
                  <span className="mk-receipt__pop" role="dialog">
                    <span className="mk-receipt__pop-ref">Employment Rights Act 1996, section 1(3)</span>
                    <p className="mk-receipt__pop-plain">The written statement must name who's employing whom — you and your new employee, in full.</p>
                    <a href="#">Read the official guidance <span className="fe-icon">open_in_new</span></a>
                  </span>
                </span>
              </div>
            </div>
      
            <div className="tr-check">
              <span className="tr-check__n fe-tabular">2</span>
              <div className="tr-check__body">
                <p className="tr-check__name">Start date and continuous-employment date</p>
                <span className="mk-receipt" data-open="false">
                  <button className="fe-receipt" aria-expanded="false"><span className="fe-icon" style={{ fontSize: "13px" }}>gavel</span> ERA 1996 s.1(3)</button>
                  <span className="mk-receipt__pop" role="dialog">
                    <span className="mk-receipt__pop-ref">Employment Rights Act 1996, section 1(3)</span>
                    <p className="mk-receipt__pop-plain">When the job starts, and the date their continuous employment counts from — this decides many later rights.</p>
                    <a href="#">Read the official guidance <span className="fe-icon">open_in_new</span></a>
                  </span>
                </span>
              </div>
            </div>
      
            <div className="tr-check">
              <span className="tr-check__n fe-tabular">3</span>
              <div className="tr-check__body">
                <p className="tr-check__name">Pay: amount, how it's worked out, and when it's paid</p>
                <span className="mk-receipt" data-open="false">
                  <button className="fe-receipt" aria-expanded="false"><span className="fe-icon" style={{ fontSize: "13px" }}>gavel</span> ERA 1996 s.1(4)(a)</button>
                  <span className="mk-receipt__pop" role="dialog">
                    <span className="mk-receipt__pop-ref">Employment Rights Act 1996, section 1(4)(a)</span>
                    <p className="mk-receipt__pop-plain">The rate of pay, how it's calculated, and whether it's paid weekly or monthly — all set out clearly.</p>
                    <a href="#">Read the official guidance <span className="fe-icon">open_in_new</span></a>
                  </span>
                </span>
              </div>
            </div>
      
            <div className="tr-check">
              <span className="tr-check__n fe-tabular">4</span>
              <div className="tr-check__body">
                <p className="tr-check__name">Paid at or above the National Minimum Wage</p>
                <span className="mk-receipt" data-open="false">
                  <button className="fe-receipt" aria-expanded="false"><span className="fe-icon" style={{ fontSize: "13px" }}>gavel</span> NMWA 1998</button>
                  <span className="mk-receipt__pop" role="dialog">
                    <span className="mk-receipt__pop-ref">National Minimum Wage Act 1998</span>
                    <p className="mk-receipt__pop-plain">The rate is checked against the legal minimum for your employee's age — it can never fall below it.</p>
                    <a href="#">Read the official guidance <span className="fe-icon">open_in_new</span></a>
                  </span>
                </span>
              </div>
            </div>
      
            <div className="tr-check">
              <span className="tr-check__n fe-tabular">5</span>
              <div className="tr-check__body">
                <p className="tr-check__name">Hours of work, including any variable hours</p>
                <span className="mk-receipt" data-open="false">
                  <button className="fe-receipt" aria-expanded="false"><span className="fe-icon" style={{ fontSize: "13px" }}>gavel</span> ERA 1996 s.1(4)(c)</button>
                  <span className="mk-receipt__pop" role="dialog">
                    <span className="mk-receipt__pop-ref">Employment Rights Act 1996, section 1(4)(c)</span>
                    <p className="mk-receipt__pop-plain">The days and hours they'll work — and whether those hours or days can vary, and how.</p>
                    <a href="#">Read the official guidance <span className="fe-icon">open_in_new</span></a>
                  </span>
                </span>
              </div>
            </div>
      
            <div className="tr-check">
              <span className="tr-check__n fe-tabular">6</span>
              <div className="tr-check__body">
                <p className="tr-check__name">Holiday entitlement — at least 5.6 weeks</p>
                <span className="mk-receipt" data-open="false">
                  <button className="fe-receipt" aria-expanded="false"><span className="fe-icon" style={{ fontSize: "13px" }}>gavel</span> WTR 1998 reg.13</button>
                  <span className="mk-receipt__pop" role="dialog">
                    <span className="mk-receipt__pop-ref">Working Time Regulations 1998, regulation 13</span>
                    <p className="mk-receipt__pop-plain">Every worker is entitled to at least 5.6 weeks' paid holiday a year. We check the clause meets it.</p>
                    <a href="#">Read the official guidance <span className="fe-icon">open_in_new</span></a>
                  </span>
                </span>
              </div>
            </div>
      
            <div className="tr-check">
              <span className="tr-check__n fe-tabular">7</span>
              <div className="tr-check__body">
                <p className="tr-check__name">Job title or a short description of the work</p>
                <span className="mk-receipt" data-open="false">
                  <button className="fe-receipt" aria-expanded="false"><span className="fe-icon" style={{ fontSize: "13px" }}>gavel</span> ERA 1996 s.1(4)(f)</button>
                  <span className="mk-receipt__pop" role="dialog">
                    <span className="mk-receipt__pop-ref">Employment Rights Act 1996, section 1(4)(f)</span>
                    <p className="mk-receipt__pop-plain">What the job actually is — a title, or a brief description of the work they'll do.</p>
                    <a href="#">Read the official guidance <span className="fe-icon">open_in_new</span></a>
                  </span>
                </span>
              </div>
            </div>
      
            <div className="tr-check">
              <span className="tr-check__n fe-tabular">8</span>
              <div className="tr-check__body">
                <p className="tr-check__name">Place of work, and any travel between sites</p>
                <span className="mk-receipt" data-open="false">
                  <button className="fe-receipt" aria-expanded="false"><span className="fe-icon" style={{ fontSize: "13px" }}>gavel</span> ERA 1996 s.1(4)(h)</button>
                  <span className="mk-receipt__pop" role="dialog">
                    <span className="mk-receipt__pop-ref">Employment Rights Act 1996, section 1(4)(h)</span>
                    <p className="mk-receipt__pop-plain">Where they'll be based, and whether they'll be asked to work at more than one place.</p>
                    <a href="#">Read the official guidance <span className="fe-icon">open_in_new</span></a>
                  </span>
                </span>
              </div>
            </div>
      
            <div className="tr-check">
              <span className="tr-check__n fe-tabular">9</span>
              <div className="tr-check__body">
                <p className="tr-check__name">Notice periods for both sides</p>
                <span className="mk-receipt" data-open="false">
                  <button className="fe-receipt" aria-expanded="false"><span className="fe-icon" style={{ fontSize: "13px" }}>gavel</span> ERA 1996 s.86</button>
                  <span className="mk-receipt__pop" role="dialog">
                    <span className="mk-receipt__pop-ref">Employment Rights Act 1996, section 86</span>
                    <p className="mk-receipt__pop-plain">There's a legal minimum notice each side must give, and it grows with length of service. We check both.</p>
                    <a href="#">Read the official guidance <span className="fe-icon">open_in_new</span></a>
                  </span>
                </span>
              </div>
            </div>
      
            <div className="tr-check">
              <span className="tr-check__n fe-tabular">10</span>
              <div className="tr-check__body">
                <p className="tr-check__name">Sick pay and sick-leave terms</p>
                <span className="mk-receipt" data-open="false">
                  <button className="fe-receipt" aria-expanded="false"><span className="fe-icon" style={{ fontSize: "13px" }}>gavel</span> ERA 1996 s.1(4)(d)</button>
                  <span className="mk-receipt__pop" role="dialog">
                    <span className="mk-receipt__pop-ref">Employment Rights Act 1996, section 1(4)(d)(ii)</span>
                    <p className="mk-receipt__pop-plain">What happens if they're off sick, including any entitlement to statutory sick pay.</p>
                    <a href="#">Read the official guidance <span className="fe-icon">open_in_new</span></a>
                  </span>
                </span>
              </div>
            </div>
      
            <div className="tr-check">
              <span className="tr-check__n fe-tabular">11</span>
              <div className="tr-check__body">
                <p className="tr-check__name">Pension and auto-enrolment arrangements</p>
                <span className="mk-receipt" data-open="false">
                  <button className="fe-receipt" aria-expanded="false"><span className="fe-icon" style={{ fontSize: "13px" }}>gavel</span> Pensions Act 2008</button>
                  <span className="mk-receipt__pop" role="dialog">
                    <span className="mk-receipt__pop-ref">Pensions Act 2008 — auto-enrolment</span>
                    <p className="mk-receipt__pop-plain">Most employees must be enrolled in a workplace pension. The contract must set out the arrangement.</p>
                    <a href="#">Read the official guidance <span className="fe-icon">open_in_new</span></a>
                  </span>
                </span>
              </div>
            </div>
      
            <div className="tr-check">
              <span className="tr-check__n fe-tabular">12</span>
              <div className="tr-check__body">
                <p className="tr-check__name">Probationary period, including its length and terms</p>
                <span className="mk-receipt" data-open="false">
                  <button className="fe-receipt" aria-expanded="false"><span className="fe-icon" style={{ fontSize: "13px" }}>gavel</span> ERA 1996 s.1(4)</button>
                  <span className="mk-receipt__pop" role="dialog">
                    <span className="mk-receipt__pop-ref">Employment Rights Act 1996, section 1(4) (from April 2020)</span>
                    <p className="mk-receipt__pop-plain">If there's a probation period, its length and conditions must be written down from day one.</p>
                    <a href="#">Read the official guidance <span className="fe-icon">open_in_new</span></a>
                  </span>
                </span>
              </div>
            </div>
      
            <div className="tr-check">
              <span className="tr-check__n fe-tabular">13</span>
              <div className="tr-check__body">
                <p className="tr-check__name">Disciplinary and grievance procedures</p>
                <span className="mk-receipt" data-open="false">
                  <button className="fe-receipt" aria-expanded="false"><span className="fe-icon" style={{ fontSize: "13px" }}>gavel</span> ERA 1996 s.3</button>
                  <span className="mk-receipt__pop" role="dialog">
                    <span className="mk-receipt__pop-ref">Employment Rights Act 1996, section 3</span>
                    <p className="mk-receipt__pop-plain">How concerns are raised and handled on both sides — the contract must point to a clear process.</p>
                    <a href="#">Read the official guidance <span className="fe-icon">open_in_new</span></a>
                  </span>
                </span>
              </div>
            </div>
      
          </div>
        </div>
      </section>
      
      {/* ============ DATA SECURITY ============ */}
      <section className="mk-section mk-raised">
        <div className="mk-wrap">
          <div style={{ maxWidth: "720px" }}>
            <span className="mk-eyebrow"><span className="fe-icon" style={{ fontSize: "16px" }}>lock</span> Data security</span>
            <h2 className="mk-h2">Your records, kept in the UK and kept safe.</h2>
            <p className="mk-lede">Right-to-work documents and contracts are sensitive. We hold them the way the law expects — and no more loosely.</p>
          </div>
      
          <div className="tr-sec-grid">
            <div className="tr-sec">
              <span className="tr-sec__ic"><span className="fe-icon">dns</span></span>
              <p className="tr-sec__title">UK-region hosting</p>
              <p className="tr-sec__body">Your data is stored and processed on servers in the United Kingdom — it doesn't leave the region.</p>
            </div>
            <div className="tr-sec">
              <span className="tr-sec__ic"><span className="fe-icon">enhanced_encryption</span></span>
              <p className="tr-sec__title">Encrypted, at rest and in transit</p>
              <p className="tr-sec__body">Everything is encrypted while it's stored and while it moves — so it's unreadable if intercepted.</p>
            </div>
            <div className="tr-sec">
              <span className="tr-sec__ic"><span className="fe-icon">key</span></span>
              <p className="tr-sec__title">Row-level security</p>
              <p className="tr-sec__body">Access is enforced record by record. Your business only ever sees its own data — never anyone else's.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* ============ COMPLIANCE & ASSURANCE ============ */}
      <section className="mk-section">
        <div className="mk-wrap">
          <div style={{ maxWidth: "720px" }}>
            <span className="mk-eyebrow"><span className="fe-icon" style={{ fontSize: "16px" }}>verified_user</span> Compliance &amp; assurance</span>
            <h2 className="mk-h2">Registered, insured and independently reviewed.</h2>
          </div>
      
          <div className="tr-assure">
            <div className="tr-assure__item">
              <span className="tr-assure__ic"><span className="fe-icon">how_to_reg</span></span>
              <div>
                <p className="tr-assure__title">ICO registered</p>
                <p className="tr-assure__body">We're registered with the Information Commissioner's Office as a data controller. Registration <span className="fe-tabular">ZB812640</span>.</p>
              </div>
            </div>
            <div className="tr-assure__item">
              <span className="tr-assure__ic"><span className="fe-icon">assignment_turned_in</span></span>
              <div>
                <p className="tr-assure__title">DPIA completed</p>
                <p className="tr-assure__body">A Data Protection Impact Assessment has been carried out for how we handle right-to-work and employment records.</p>
              </div>
            </div>
            <div className="tr-assure__item">
              <span className="tr-assure__ic"><span className="fe-icon">account_balance</span></span>
              <div>
                <p className="tr-assure__title">£1m professional indemnity</p>
                <p className="tr-assure__body">We carry <span className="fe-tabular">£1,000,000</span> of professional indemnity insurance covering the guidance and documents we provide.</p>
              </div>
            </div>
            <div className="tr-assure__item">
              <span className="tr-assure__ic"><span className="fe-icon">gavel</span></span>
              <div>
                <p className="tr-assure__title">Solicitor-reviewed clause library</p>
                <p className="tr-assure__body">Every clause our documents draw on has been reviewed by a qualified employment solicitor before it's used.</p>
              </div>
            </div>
      
            {/* Cyber Essentials badge slot */}
            <div className="tr-badge-slot">
              <div className="image-slot" role="img" aria-label="Cyber Essentials badge" style={{ background: "var(--neutral-100)", display: "grid", placeItems: "center", color: "var(--neutral-400)", font: "500 13px/1.3 var(--font-body)" }}>Cyber Essentials badge</div>
              <div className="tr-badge-slot__body">
                <p className="tr-assure__title" style={{ marginBottom: "6px" }}>Cyber Essentials</p>
                <p className="tr-assure__body">Certified under the UK government-backed Cyber Essentials scheme, covering the security controls that stop the most common cyber attacks.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* ============ WHAT WE ARE NOT ============ */}
      <section className="mk-section tr-not">
        <div className="mk-wrap">
          <span className="mk-eyebrow"><span className="fe-icon" style={{ fontSize: "16px" }}>handshake</span> An honest account</span>
          <h2 className="mk-h2">What we are not.</h2>
          <p className="tr-not__lede">Trust is built on knowing our limits as clearly as our strengths. Here's where FirstEmployer stops — and where you should reach for a person, not a platform.</p>
      
          <div className="tr-not__grid">
            <div className="tr-not__item">
              <span className="fe-icon">balance</span>
              <p className="tr-not__title">We are not legal advice</p>
              <p className="tr-not__body">We provide guidance and generate documents based on current UK employment law. That isn't the same as a solicitor advising on your specific situation — and we never pretend it is.</p>
            </div>
            <div className="tr-not__item">
              <span className="fe-icon">gavel</span>
              <p className="tr-not__title">We are not your representative</p>
              <p className="tr-not__body">If a dispute could reach an employment tribunal — a contested dismissal, a discrimination claim — you need someone acting for you. We'll tell you plainly, and point you to professional help.</p>
            </div>
            <div className="tr-not__item">
              <span className="fe-icon">record_voice_over</span>
              <p className="tr-not__title">We are not silent about it</p>
              <p className="tr-not__body">When a question is beyond us, the assistant says so rather than guessing. Knowing when to stop is part of getting it right — and part of keeping you safe.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* ============ FINAL CTA ============ */}
      <section className="mk-final">
        <div className="mk-wrap mk-final__inner">
          <h2 className="mk-final__h">Compliance you can actually trust.</h2>
          <p className="mk-final__p">Checked documents, safe data, and honesty about the limits. Try it free for 7 days.</p>
          <a className="fe-btn fe-btn--primary" href="#" style={{ fontSize: "18px", minHeight: "56px", padding: "0 34px" }}>Start free trial</a>
          <div className="mk-trustline" style={{ justifyContent: "center" }}>
            <span><span className="fe-icon">check_circle</span> No card required</span>
            <span><span className="fe-icon">check_circle</span> Cancel any time</span>
          </div>
        </div>
      </section>
      
      {/* ============ FOOTER ============ */}
      <footer className="mk-footer">
        <div className="mk-wrap mk-footer__inner">
          <span>© 2026 FirstEmployer · Get to green.</span>
          <span className="mk-footer__links">
            <a href="/">How it works</a>
            <a href="/pricing">Pricing</a>
            <a href="/trust">Trust &amp; security</a>
            <a href="/about">About</a>
          </span>
        </div>
      </footer>
    </>
  );
}
