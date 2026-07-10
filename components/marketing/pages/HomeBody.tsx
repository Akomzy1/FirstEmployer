/* Ported from the Claude Design export (binding visual spec — CLAUDE.md Rule 6).
 * Mechanically converted HTML->JSX; links and statutory literals adjusted in
 * follow-up edits (rates render from getLiveConfig — Rule 4). */
/* eslint-disable @next/next/no-img-element, react/no-unescaped-entities */
import type { MarketingVars } from "@/lib/marketing/vars";
export function HomeBody({ v }: { v: MarketingVars }) {
  return (
    <>
      {/* ============ NAV ============ */}
      
      
      <span id="top"></span>
      
      {/* ============ 1. HERO ============ */}
      <header className="hero section" id="hero" data-screen-label="hero">
        <div className="wrap hero__grid">
          <div className="hero__copy">
            <p className="eyebrow"><span className="fe-icon">balance</span>For your first hire</p>
            <h1>Hire your first employee. <em>Legally.</em> Without a £2,000 accountant bill.</h1>
            <p className="hero__sub">One guided path through all eight legal duties — employment status, PAYE registration, a written contract, right-to-work checks, workplace pension, employer's liability insurance, payslips and record-keeping — for £{v.launchPrice} a month.</p>
            <div className="hero__cta">
              <a className="fe-btn fe-btn--primary" href="/readiness">Check if you're ready to hire — free, 2 minutes</a>
              <a className="fe-btn fe-btn--secondary" href="#journey">See how it works</a>
            </div>
            <div className="hero__trust">
              <span><span className="fe-icon">check</span>No card required</span>
              <span><span className="fe-icon">check</span>Built for UK sole traders</span>
              <span><span className="fe-icon">check</span>Cancel any time</span>
            </div>
          </div>
      
          {/* All-green dashboard device mock */}
          <div className="hero__visual">
            <div className="device" role="img" aria-label="The FirstEmployer compliance dashboard showing all eight legal duties met, in green.">
              <div className="device__bar">
                <span className="dot dot--r"></span><span className="dot dot--y"></span><span className="dot dot--g"></span>
                <span className="device__url"><span className="fe-icon">lock</span>app.firstemployer.co.uk/dashboard</span>
              </div>
              <div className="device__body">
                <aside className="dash__side">
                  <a className="brand" href="#" style={{ fontSize: "15px", marginBottom: "16px", pointerEvents: "none" }}>
                    <span className="brand__mark" style={{ width: "24px", height: "24px" }}><span className="fe-icon fe-icon--fill" style={{ fontSize: "16px" }}>verified</span></span>
                    FirstEmployer
                  </a>
                  <div className="dash__biz">
                    <small>Business</small>
                    <div className="dash__biz-row"><span className="dash__avatar">DO</span><b>DO Plumbing &amp;<br />Heating Ltd</b></div>
                  </div>
                  <nav className="dash__nav">
                    <a href="#"><span className="fe-icon">home</span>Home</a>
                    <a href="#" className="is-active"><span className="fe-icon">monitoring</span>Dashboard</a>
                    <a href="#"><span className="fe-icon">description</span>Documents</a>
                    <a href="#"><span className="fe-icon">forum</span>Assistant</a>
                  </nav>
                </aside>
                <div className="dash__main">
                  <p className="dash__ey">Compliance dashboard</p>
                  <p className="dash__title">Everything the law asks of you, in one place.</p>
                  <div className="donut">
                    <svg width="150" height="150" viewBox="0 0 150 150" aria-hidden="true">
                      <circle cx="75" cy="75" r="62" fill="none" stroke="#EAE6DD" strokeWidth="13"></circle>
                      <circle cx="75" cy="75" r="62" fill="none" stroke="#1E9E6A" strokeWidth="13" strokeLinecap="round" strokeDasharray="389.6" strokeDashoffset="6" transform="rotate(-90 75 75)"></circle>
                      <path d="M60 76 l10 10 l22 -24" fill="none" stroke="#1E9E6A" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                    <div className="donut__center" style={{ position: "absolute" }}>
                      <div className="donut__num fe-tabular">8</div>
                      <div className="donut__label fe-tabular">of 8 met</div>
                    </div>
                  </div>
                  <div className="dash__rows">
                    <div className="dash__row"><span className="fe-icon fe-icon--fill">check_circle</span>Registered with HMRC<span className="mini-pill">Done</span></div>
                    <div className="dash__row"><span className="fe-icon fe-icon--fill">check_circle</span>Contract issued &amp; verified<span className="mini-pill">Done</span></div>
                    <div className="dash__row"><span className="fe-icon fe-icon--fill">check_circle</span>Pension set up<span className="mini-pill">Done</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* ============ ALREADY EMPLOYING BAND ============ */}
      <section className="already" data-screen-label="already-employing">
        <div className="wrap already__inner">
          <span className="already__mark"><span className="fe-icon">groups</span></span>
          <div className="already__text">
            <b>Already employing people?</b>
            <p>FirstEmployer checks what you've got, finds the gaps, and keeps you compliant.</p>
          </div>
          <div className="already__cta">
            <a className="fe-btn fe-btn--secondary fe-btn--sm" href="/readiness">Check my current setup</a>
          </div>
        </div>
      </section>
      
      {/* ============ 2. RISK BAR ============ */}
      <section className="risk section" data-screen-label="risk-bar">
        <div className="wrap">
          <p className="eyebrow">The stakes</p>
          <h2>Getting it wrong is expensive. Getting it right is £{v.launchPrice}.</h2>
          <div className="risk__grid">
            <div className="risk__cell">
              <div className="risk__stat fe-tabular">£{v.rtwPenalty}</div>
              <p className="risk__claim">Maximum civil penalty per illegal worker.</p>
              <p className="risk__source"><span className="fe-icon">gavel</span>Home Office, 2024</p>
            </div>
            <div className="risk__cell">
              <div className="risk__stat fe-tabular">£2,500<span style={{ fontSize: "22px" }}>/day</span></div>
              <p className="risk__claim">Fine for trading without employer's liability insurance.</p>
              <p className="risk__source"><span className="fe-icon">gavel</span>Health &amp; Safety Executive</p>
            </div>
            <div className="risk__cell">
              <div className="risk__stat fe-tabular">2,438</div>
              <p className="risk__claim">Illegal-working penalties issued to employers in 2025.</p>
              <p className="risk__source"><span className="fe-icon">gavel</span>Home Office, 2025</p>
            </div>
            <div className="risk__cell">
              <div className="risk__stat fe-tabular">£130m+</div>
              <p className="risk__claim">Total penalties issued to UK employers over the period.</p>
              <p className="risk__source"><span className="fe-icon">gavel</span>Home Office, 2025</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* ============ 3. JOURNEY ============ */}
      <section className="section" id="journey" data-screen-label="journey">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">How it works</p>
            <h2>Eight legal duties. Six guided steps. One clear path.</h2>
            <p>You answer plain questions. We do the legal work, generate the documents, and keep watch after your first hire starts.</p>
          </div>
          <div className="journey__grid">
      
            {/* 1 Status Advisor */}
            <article className="step">
              <div className="step__n"><span className="step__badge"><span className="fe-icon">balance</span></span><span className="step__count">Step 1</span></div>
              <h3>Check who you're hiring</h3>
              <p>We work out if your person is truly an employee, so you start on the right footing.</p>
              <div className="step__shot">
                <p className="ms__ey">Status advisor</p>
                <p className="ms__h">Is this an employee?</p>
                <div className="ms__line"><span className="fe-icon fe-icon--fill" style={{ color: "var(--verified-green-600)" }}>check_circle</span>Set hours &amp; a fixed rate<span className="tag tag--green">Employee</span></div>
                <div className="ms__line"><span className="fe-icon fe-icon--fill" style={{ color: "var(--verified-green-600)" }}>check_circle</span>Works only for you</div>
                <div className="ms__line"><span className="fe-icon" style={{ color: "var(--neutral-400)" }}>radio_button_unchecked</span>Sends their own invoices</div>
              </div>
            </article>
      
            {/* 2 Setup Engine */}
            <article className="step">
              <div className="step__n"><span className="step__badge"><span className="fe-icon">assignment_turned_in</span></span><span className="step__count">Step 2</span></div>
              <h3>Set yourself up as an employer</h3>
              <p>Register for PAYE with HMRC, sort payroll and a pension — one task at a time.</p>
              <div className="step__shot">
                <p className="ms__ey">Your setup</p>
                <p className="ms__h">5 of 7 done</p>
                <div className="ms__bar"><i style={{ width: "71%" }}></i></div>
                <div className="ms__line"><span className="fe-icon fe-icon--fill" style={{ color: "var(--verified-green-600)" }}>check_circle</span>Register with HMRC<span className="tag tag--green">Done</span></div>
                <div className="ms__line"><span className="fe-icon" style={{ color: "var(--amber-500)" }}>hourglass_top</span>Set up the pension<span className="tag tag--amber">Next</span></div>
              </div>
            </article>
      
            {/* 3 Contracts + Examiner */}
            <article className="step">
              <div className="step__n"><span className="step__badge"><span className="fe-icon">contract</span></span><span className="step__count">Step 3</span></div>
              <h3>Generate a verified contract</h3>
              <p>One AI writes the contract; a second, independent AI checks it against the law.</p>
              <div className="step__shot">
                <p className="ms__ey">Document</p>
                <p className="ms__h">Contract of employment</p>
                <div className="ms__line"><span className="fe-icon fe-icon--fill" style={{ color: "var(--verified-green-600)" }}>verified</span>Passed all 13 checks<span className="tag tag--green">Verified</span></div>
                <div className="ms__line"><span className="fe-icon" style={{ color: "var(--neutral-500)" }}>description</span>Ready to sign &amp; send</div>
              </div>
            </article>
      
            {/* 4 Right to Work */}
            <article className="step">
              <div className="step__n"><span className="step__badge"><span className="fe-icon">front_hand</span></span><span className="step__count">Step 4</span></div>
              <h3>Check their right to work</h3>
              <p>We guide the check in minutes and store the proof that gives you a legal defence.</p>
              <div className="step__shot">
                <p className="ms__ey">Right to work</p>
                <p className="ms__h">Who can work for you</p>
                <div className="ms__line"><span className="fe-icon fe-icon--fill" style={{ color: "var(--verified-green-600)" }}>check_circle</span>Aisha — checked &amp; stored<span className="tag tag--green">Valid</span></div>
                <div className="ms__line"><span className="fe-icon" style={{ color: "var(--amber-500)" }}>schedule</span>Follow-up due 30 Sep 2026<span className="tag tag--amber">Reminder set</span></div>
              </div>
            </article>
      
            {/* 5 Dashboard */}
            <article className="step">
              <div className="step__n"><span className="step__badge"><span className="fe-icon">monitoring</span></span><span className="step__count">Step 5</span></div>
              <h3>See everything in one place</h3>
              <p>Your live dashboard shows every duty at a glance — and turns green when you're compliant.</p>
              <div className="step__shot">
                <p className="ms__ey">Compliance dashboard</p>
                <p className="ms__h">8 of 8 met</p>
                <div className="ms__bar"><i className="g" style={{ width: "100%" }}></i></div>
                <div className="ms__line"><span className="fe-icon fe-icon--fill" style={{ color: "var(--verified-green-600)" }}>check_circle</span>All duties compliant<span className="tag tag--green">All green</span></div>
              </div>
            </article>
      
            {/* 6 Assistant */}
            <article className="step">
              <div className="step__n"><span className="step__badge"><span className="fe-icon">forum</span></span><span className="step__count">Step 6</span></div>
              <h3>Ask anything, any time</h3>
              <p>The assistant answers in plain English, grounded in official guidance — and knows its limits.</p>
              <div className="step__shot">
                <p className="ms__ey">Assistant · grounded in official guidance</p>
                <div className="ms__q">Can I just sack someone in probation?</div>
                <div className="ms__a">Letting someone go is a legal decision, even in probation. Here's the safe next move…</div>
              </div>
            </article>
      
          </div>
        </div>
      </section>
      
      {/* ============ 4. EXAMINER TRUST ============ */}
      <section className="examiner section" id="examiner" data-screen-label="examiner">
        <div className="wrap examiner__grid">
          <div className="examiner__copy">
            <p className="eyebrow">Why you can trust the documents</p>
            <h2>One AI writes it. A second, independent AI <em>checks it.</em></h2>
            <p>Your contract is checked against 13 separate legal requirements before it ever reaches you. If it fails a single one, it goes back — you only ever see documents that passed.</p>
            <a className="examiner__link" href="#">Read how the Examiner works<span className="fe-icon">arrow_forward</span></a>
          </div>
      
          <div className="reveal" role="img" aria-label="A verified contract of employment that passed all thirteen of the Examiner's legal checks.">
            <div className="reveal__doc">
              <div className="reveal__seal"><span className="fe-icon fe-icon--fill">verified</span></div>
              <h4>Contract of employment</h4>
              <small className="fe-tabular">DO Plumbing &amp; Heating Ltd · 14 Mar 2026</small>
              <div className="reveal__checks">
                <div className="reveal__check"><span className="fe-icon fe-icon--fill">check</span>Written statement of particulars<span className="ref">
                  <span className="rc"><button className="fe-receipt" aria-expanded="false" data-rc="">ERA 1996 s.1</button>
                    <span className="rc__pop fe-receipt__pop">
                      <h5>Employment Rights Act 1996, section 1</h5>
                      <p>Your employee must be given a written statement of their main terms — pay, hours, holiday — on or before their first day.</p>
                      <a href="#">Read the official guidance<span className="fe-icon">open_in_new</span></a>
                    </span>
                  </span></span></div>
                <div className="reveal__check"><span className="fe-icon fe-icon--fill">check</span>Lawful notice periods<span className="ref">
                  <span className="rc"><button className="fe-receipt" aria-expanded="false" data-rc="">ERA 1996 s.86</button>
                    <span className="rc__pop fe-receipt__pop">
                      <h5>Employment Rights Act 1996, section 86</h5>
                      <p>There's a legal minimum amount of notice you must give an employee, which grows with their length of service.</p>
                      <a href="#">Read the official guidance<span className="fe-icon">open_in_new</span></a>
                    </span>
                  </span></span></div>
                <div className="reveal__check"><span className="fe-icon fe-icon--fill">check</span>At least the National Minimum Wage<span className="ref">
                  <span className="rc"><button className="fe-receipt" aria-expanded="false" data-rc="">NMWA 1998</button>
                    <span className="rc__pop fe-receipt__pop">
                      <h5>National Minimum Wage Act 1998</h5>
                      <p>You must pay at least the legal minimum for your employee's age. We check the rate against the current bands for you.</p>
                      <a href="#">Read the official guidance<span className="fe-icon">open_in_new</span></a>
                    </span>
                  </span></span></div>
              </div>
              <div className="reveal__meta"><span className="fe-icon fe-icon--fill" style={{ color: "var(--verified-green-600)", fontSize: "18px" }}>verified</span><b>Passed all 13 checks.</b><span>Verified 14 Mar 2026</span></div>
            </div>
          </div>
        </div>
      </section>
      
      {/* ============ 5. PERSONA PROOF ============ */}
      <section className="personas section" data-screen-label="personas">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">Who it's for</p>
            <h2>Real first hires, handled properly.</h2>
            <p>Three common situations we see every week. Names are illustrative — the duties are exactly the same.</p>
          </div>
          <div className="persona__grid">
      
            <article className="persona">
              <div className="image-slot" role="img" aria-label="Photo — Dave in his van" style={{ background: "var(--neutral-100)", display: "grid", placeItems: "center", color: "var(--neutral-400)", font: "500 13px/1.3 var(--font-body)" }}>Photo — Dave in his van</div>
              <div className="persona__body">
                <div className="persona__who"><b>Dave</b><span>Plumber · Walsall</span></div>
                <p>Dave is taking on his first apprentice. He's never run payroll and doesn't know if he needs a pension. FirstEmployer walks him through HMRC registration, writes the apprentice's contract, and sets a reminder for the pension.</p>
                <span className="persona__out"><span className="fe-icon fe-icon--fill">verified</span>All 8 duties met in a weekend</span>
              </div>
            </article>
      
            <article className="persona">
              <div className="image-slot" role="img" aria-label="Photo — Amara at her salon" style={{ background: "var(--neutral-100)", display: "grid", placeItems: "center", color: "var(--neutral-400)", font: "500 13px/1.3 var(--font-body)" }}>Photo — Amara at her salon</div>
              <div className="persona__body">
                <div className="persona__who"><b>Amara</b><span>Salon owner · Leicester</span></div>
                <p>Amara is hiring a stylist and worried about getting the right-to-work check wrong. She does the guided check in minutes, stores the proof, and gets a follow-up reminder before the visa expires — a legal defence, kept safe.</p>
                <span className="persona__out"><span className="fe-icon fe-icon--fill">verified</span>Right-to-work proof, stored</span>
              </div>
            </article>
      
            <article className="persona">
              <div className="image-slot" role="img" aria-label="Photo — Yusuf at his counter" style={{ background: "var(--neutral-100)", display: "grid", placeItems: "center", color: "var(--neutral-400)", font: "500 13px/1.3 var(--font-body)" }}>Photo — Yusuf at his counter</div>
              <div className="persona__body">
                <div className="persona__who"><b>Yusuf</b><span>Takeaway owner · Bradford</span></div>
                <p>Yusuf has two staff on cash-in-hand and knows it's a risk. He moves them onto proper contracts with payslips and insurance, and now sees every duty on one dashboard — green, and monitored as the law changes.</p>
                <span className="persona__out"><span className="fe-icon fe-icon--fill">verified</span>From at-risk to all green</span>
              </div>
            </article>
      
          </div>
        </div>
      </section>
      
      {/* ============ 6. COMPARISON ============ */}
      <section className="section" data-screen-label="comparison">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">An honest comparison</p>
            <h2>Do it yourself, pay an accountant, or use us.</h2>
            <p>We're not right for every business. Here's the honest picture, so you can decide.</p>
          </div>
          <div className="cmp">
            <div className="cmp__row cmp__head">
              <div className="cmp__cell lab"></div>
              <div className="cmp__cell">Do it yourself</div>
              <div className="cmp__cell">High-street accountant</div>
              <div className="cmp__cell cmp__col-fe">FirstEmployer</div>
            </div>
            <div className="cmp__row">
              <div className="cmp__cell lab">Upfront cost</div>
              <div className="cmp__cell" data-col="Do it yourself"><span className="cmp__num fe-tabular">£0</span></div>
              <div className="cmp__cell" data-col="Accountant"><span className="cmp__num fe-tabular">£500–£2,000</span></div>
              <div className="cmp__cell cmp__col-fe" data-col="FirstEmployer"><span className="cmp__num fe-tabular">£{v.launchPrice}/mo</span></div>
            </div>
            <div className="cmp__row">
              <div className="cmp__cell lab">Ongoing monitoring</div>
              <div className="cmp__cell" data-col="Do it yourself"><span className="cmp__val"><span className="fe-icon no">close</span>You remember it all</span></div>
              <div className="cmp__cell" data-col="Accountant"><span className="cmp__val"><span className="fe-icon warn">remove</span>Only when you ask</span></div>
              <div className="cmp__cell cmp__col-fe" data-col="FirstEmployer"><span className="cmp__val"><span className="fe-icon ok">check</span>Live dashboard</span></div>
            </div>
            <div className="cmp__row">
              <div className="cmp__cell lab">Documents legally checked</div>
              <div className="cmp__cell" data-col="Do it yourself"><span className="cmp__val"><span className="fe-icon no">close</span>Up to you</span></div>
              <div className="cmp__cell" data-col="Accountant"><span className="cmp__val"><span className="fe-icon ok">check</span>By one person</span></div>
              <div className="cmp__cell cmp__col-fe" data-col="FirstEmployer"><span className="cmp__val"><span className="fe-icon ok">check</span>13-point Examiner</span></div>
            </div>
            <div className="cmp__row">
              <div className="cmp__cell lab">Updated when the law changes</div>
              <div className="cmp__cell" data-col="Do it yourself"><span className="cmp__val"><span className="fe-icon no">close</span>No</span></div>
              <div className="cmp__cell" data-col="Accountant"><span className="cmp__val"><span className="fe-icon warn">remove</span>At their pace</span></div>
              <div className="cmp__cell cmp__col-fe" data-col="FirstEmployer"><span className="cmp__val"><span className="fe-icon ok">check</span>Automatically</span></div>
            </div>
          </div>
        </div>
      </section>
      
      {/* ============ 7. PRICING ============ */}
      <section className="section" id="pricing" data-screen-label="pricing">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">Pricing</p>
            <h2>One price. No accountant's invoice.</h2>
            <p>Start free. Move up only when you're ready to hire. Cancel any time.</p>
          </div>
          <div className="price__grid">
      
            <div className="tier">
              <div className="tier__name">Check</div>
              <p className="tier__for">See where you stand</p>
              <div className="tier__price"><b className="fe-tabular">Free</b></div>
              <p className="tier__note">No card required</p>
              <ul className="tier__list">
                <li><span className="fe-icon">check</span>2-minute readiness check</li>
                <li><span className="fe-icon">check</span>Your eight duties, explained</li>
                <li><span className="fe-icon">check</span>Employment status advisor</li>
              </ul>
              <a className="fe-btn fe-btn--secondary" href="#">Start free</a>
            </div>
      
            <div className="tier tier--hi">
              <span className="tier__flag">Most popular</span>
              <div className="tier__name">Launch</div>
              <p className="tier__for">Everything to hire your first employee</p>
              <div className="tier__price"><b className="fe-tabular">£{v.launchPrice}</b><span>/month</span></div>
              <p className="tier__note">Billed monthly · cancel any time</p>
              <ul className="tier__list">
                <li><span className="fe-icon">check</span>Everything in Check</li>
                <li><span className="fe-icon">check</span>Verified contracts &amp; documents</li>
                <li><span className="fe-icon">check</span>Right-to-work checks &amp; storage</li>
                <li><span className="fe-icon">check</span>Live compliance dashboard</li>
                <li><span className="fe-icon">check</span>AI assistant, grounded in guidance</li>
              </ul>
              <a className="fe-btn fe-btn--primary" href="#">Start free trial</a>
            </div>
      
            <div className="tier">
              <div className="tier__name">Grow</div>
              <p className="tier__for">For a small, growing team</p>
              <div className="tier__price"><b className="fe-tabular">£{v.growthPrice}</b><span>/month</span></div>
              <p className="tier__note">Billed monthly · cancel any time</p>
              <ul className="tier__list">
                <li><span className="fe-icon">check</span>Everything in Launch</li>
                <li><span className="fe-icon">check</span>Up to 10 employees</li>
                <li><span className="fe-icon">check</span>Multiple contract templates</li>
                <li><span className="fe-icon">check</span>Priority support</li>
              </ul>
              <a className="fe-btn fe-btn--secondary" href="#">Start free trial</a>
            </div>
      
          </div>
        </div>
      </section>
      
      {/* ============ 8. FAQ ============ */}
      <section className="section personas" id="faq" data-screen-label="faq" style={{ background: "#F2EDE3" }}>
        <div className="wrap faq__grid">
          <div className="section-head" style={{ margin: "0" }}>
            <p className="eyebrow">Questions</p>
            <h2>The things first-time employers ask us.</h2>
            <p>Straight answers. If yours isn't here, the assistant can help.</p>
          </div>
          <div className="faq__list" id="faqList">
            <div className="faq__item">
              <button className="faq__q">Do I legally need a written contract for my first employee?<span className="fe-icon">add</span></button>
              <div className="faq__a"><div>Yes. By law you must give every employee a written statement of their main employment terms — including pay, hours and holiday — on or before their first day of work. This is required under the Employment Rights Act 1996. FirstEmployer generates a compliant written contract that includes every particular the law requires.</div></div>
            </div>
            <div className="faq__item">
              <button className="faq__q">Is a contract written by ChatGPT actually legal?<span className="fe-icon">add</span></button>
              <div className="faq__a"><div>It might be, but you have no way to know. A general chatbot won't reliably include every legal particular, and it can invent clauses that don't apply in the UK. Every FirstEmployer contract is checked by a second, independent AI against 13 separate legal requirements before you see it — so you never rely on an unchecked document.</div></div>
            </div>
            <div className="faq__item">
              <button className="faq__q">What are the eight legal duties when you hire someone?<span className="fe-icon">add</span></button>
              <div className="faq__a"><div>They are: confirming employment status, registering as an employer for PAYE with HMRC, issuing a written contract, checking the person's right to work, enrolling them in a workplace pension, taking out employer's liability insurance, running payroll with payslips, and keeping proper records. FirstEmployer guides you through all eight in one place.</div></div>
            </div>
            <div className="faq__item">
              <button className="faq__q">How much does an accountant charge to set this up?<span className="fe-icon">add</span></button>
              <div className="faq__a"><div>A high-street accountant typically charges between £500 and £2,000 to set you up as an employer, plus ongoing monthly fees for payroll. FirstEmployer covers the same setup and keeps monitoring your compliance for £{v.launchPrice} a month, with no large upfront bill and the freedom to cancel whenever you choose.</div></div>
            </div>
            <div className="faq__item">
              <button className="faq__q">What is a right-to-work check and do I have to do one?<span className="fe-icon">add</span></button>
              <div className="faq__a"><div>Before anyone starts, you must confirm they are legally allowed to work in the UK and keep proof. Done correctly, this gives you a statutory defence against a penalty of up to £{v.rtwPenalty} per illegal worker. FirstEmployer guides the check step by step and stores the evidence securely, with reminders before any visa expires.</div></div>
            </div>
            <div className="faq__item">
              <button className="faq__q">Do I need a pension for just one employee?<span className="fe-icon">add</span></button>
              <div className="faq__a"><div>Usually, yes. Under auto-enrolment rules, most employees aged 22 or over earning above the threshold must be enrolled in a workplace pension, even if you employ only one person. FirstEmployer checks whether your employee qualifies and walks you through setting up a compliant scheme and your contributions.</div></div>
            </div>
            <div className="faq__item">
              <button className="faq__q">Is FirstEmployer giving me legal advice?<span className="fe-icon">add</span></button>
              <div className="faq__a"><div>No. FirstEmployer provides guidance and generates documents based on current UK employment law — it is not a substitute for a solicitor's advice on your specific situation. For genuinely contentious matters, such as a dismissal that could reach a tribunal, we tell you plainly and point you to professional help.</div></div>
            </div>
            <div className="faq__item">
              <button className="faq__q">What happens if employment law changes after I've hired?<span className="fe-icon">add</span></button>
              <div className="faq__a"><div>Your compliance is monitored on a live dashboard, and when the law changes we update the affected duties and flag anything you need to act on. You don't have to track legislation yourself. This ongoing monitoring is included in your subscription at no extra cost, so a duty that's green today stays reliably green.</div></div>
            </div>
          </div>
        </div>
      </section>
      
      {/* ============ 9. FINAL CTA ============ */}
      <section className="final" data-screen-label="final-cta">
        <div className="wrap">
          <h2>Find out if you're ready to hire.</h2>
          <p>A free, two-minute check tells you exactly where you stand across all eight legal duties. No card, no jargon.</p>
          <div className="hero__cta" style={{ justifyContent: "center" }}>
            <a className="fe-btn fe-btn--primary" href="/readiness">Check if you're ready to hire — free, 2 minutes</a>
            <a className="fe-btn fe-btn--secondary" href="#journey">See how it works</a>
          </div>
          <p className="final__note">Trusted by first-time employers across the UK · £{v.launchPrice}/month · cancel any time</p>
        </div>
      </section>
      
      {/* ============ FOOTER ============ */}
    </>
  );
}
