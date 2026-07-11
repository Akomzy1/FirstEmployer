/* Ported from the Claude Design export (binding visual spec — CLAUDE.md Rule 6).
 * Mechanically converted HTML->JSX; links and statutory literals adjusted in
 * follow-up edits (rates render from getLiveConfig — Rule 4). */
/* eslint-disable @next/next/no-img-element, react/no-unescaped-entities */
import type { MarketingVars } from "@/lib/marketing/vars";
import { TIERS } from "@/lib/pricing";
export function PricingBody({ v }: { v: MarketingVars }) {
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
            <a href="/guides">Guides</a>
            <a href="/pricing" aria-current="page">Pricing</a>
            <a href="/trust">Trust</a>
            <a className="fe-btn fe-btn--primary mk-nav__cta" href="/auth" style={{ minHeight: "44px", padding: "0 20px", fontSize: "15px" }}>Start free trial</a>
          </div>
        </div>
      </nav>
      
      {/* ============ HERO ============ */}
      <header className="pr-hero mk-wrap">
        <span className="mk-eyebrow" style={{ display: "inline-flex", marginLeft: "auto", marginRight: "auto" }}><span className="fe-icon" style={{ fontSize: "16px" }}>payments</span> Pricing</span>
        <h1>One monthly price, not a £2,000 bill.</h1>
        <p className="pr-hero__sub">Every plan does the legal work an accountant would charge hundreds for — then keeps watching your compliance, every day, for the price of a monthly subscription.</p>
        <div className="mk-trustline">
          <span><span className="fe-icon">check_circle</span> 7-day free trial</span>
          <span><span className="fe-icon">check_circle</span> No card required</span>
          <span><span className="fe-icon">check_circle</span> Cancel any time</span>
        </div>
      </header>
      
      {/* ============ TIERS ============ */}
      <section className="mk-section pr-tiers-sec">
        <div className="mk-wrap">
          <div className="pr-billing__wrap">
            <span className="pr-billing"><span className="pr-billing__pill">Monthly</span> One simple price — no annual lock-in</span>
          </div>
      
          {/* Cards render from lib/pricing.ts (single source of truth) — the
              ported card copy oversold Starter (it is monitoring-only, PRD §10)
              and listed P1 features as current (DECISIONS 2026-07-11). */}
          <div className="pr-tiers">
            {TIERS.map((t) => (
              <article key={t.id} className={t.highlight ? "pr-tier pr-tier--hi" : "pr-tier"}>
                {t.highlight ? <span className="pr-tier__flag">Most popular</span> : null}
                <h2 className="pr-tier__name">{t.name}</h2>
                <p className="pr-tier__for">{t.for}</p>
                <div className="pr-tier__price"><b className="fe-tabular">£{t.price}</b><span>/month</span></div>
                <p className="pr-tier__note"><span className="fe-icon">check_circle</span> 7-day free trial, no card</p>
                <div className="pr-tier__div"></div>
                <p className="pr-tier__caps">Up to {t.cap} employees</p>
                <ul className="pr-tier__list">
                  {t.features.filter((f) => !f.startsWith("Up to")).map((f) => (
                    <li key={f}><span className="fe-icon fe-icon--fill">check_circle</span><span>{f}</span></li>
                  ))}
                </ul>
                <a className={t.highlight ? "fe-btn fe-btn--primary" : "fe-btn fe-btn--secondary"} href="/auth">Start free trial</a>
              </article>
            ))}
          </div>
      
          {/* one-off documents, coming soon */}
          <div className="pr-oneoff">
            <span className="pr-oneoff__ic"><span className="fe-icon">description</span></span>
            <div className="pr-oneoff__body">
              <p className="pr-oneoff__title">One-off documents</p>
              <p className="pr-oneoff__desc">Need a single examined document without a subscription? Pay per document, no monthly plan.</p>
            </div>
            <span className="pr-oneoff__foot"><span className="fe-pill fe-deadline--approaching"><span className="fe-icon" style={{ fontSize: "15px" }}>schedule</span> Coming soon</span></span>
          </div>
        </div>
      </section>
      
      {/* ============ ACCOUNTANT CALCULATOR ============ */}
      <section className="mk-section mk-raised">
        <div className="mk-wrap">
          <div style={{ textAlign: "center" }}>
            <span className="mk-eyebrow" style={{ display: "inline-flex", marginLeft: "auto", marginRight: "auto" }}><span className="fe-icon" style={{ fontSize: "16px" }}>calculate</span> The honest maths</span>
            <h2 className="mk-h2" style={{ marginLeft: "auto", marginRight: "auto", textAlign: "center", maxWidth: "22ch" }}>See what you'd pay an accountant instead.</h2>
          </div>
      
          <div className="pr-calc">
            <p className="pr-calc__q">What would an accountant charge you?</p>
            <p className="pr-calc__hint">Drag to your quote. High-street accountants typically charge £500–£2,000 to set you up as an employer.</p>
      
            <div className="pr-slider-wrap">
              <div className="pr-slider-val fe-tabular" id="accVal">£1,200</div>
              <div className="pr-slider-lab">one-off setup fee</div>
              <input className="pr-range" id="accRange" type="range" min="500" max="2000" step="50" value="1200" aria-label="Accountant one-off setup fee" />
              <div className="pr-range-ends"><span>£500</span><span>£2,000</span></div>
            </div>
      
            <div className="pr-bars">
              <div className="pr-bar">
                <div className="pr-bar__top">
                  <span className="pr-bar__name">High-street accountant <span>· one-off setup</span></span>
                  <span className="pr-bar__val fe-tabular" id="accBarVal">£1,200</span>
                </div>
                <div className="pr-bar__track"><div className="pr-bar__fill pr-bar__fill--acc" id="accBar"></div></div>
              </div>
              <div className="pr-bar">
                <div className="pr-bar__top">
                  <span className="pr-bar__name">FirstEmployer Launch <span>· a full year, monitored</span></span>
                  <span className="pr-bar__val fe-tabular" id="feBarVal">£179.88</span>
                </div>
                <div className="pr-bar__track"><div className="pr-bar__fill pr-bar__fill--fe" id="feBar"></div></div>
              </div>
            </div>
      
            <div className="pr-calc__result">
              <span className="fe-icon fe-icon--fill">savings</span>
              <div>
                <div className="pr-calc__result-num">You'd keep <b id="saveNum">£1,020.12</b> in your first year.</div>
                <div className="pr-calc__result-sub">And here's the real difference: an accountant sets you up <strong>once</strong>. FirstEmployer keeps watching your compliance <strong>every day after</strong> — flagging deadlines and law changes — for less than the cost of that single invoice.</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* ============ FAQ ============ */}
      <section className="mk-section">
        <div className="mk-wrap">
          <div className="pr-faq-head">
            <span className="mk-eyebrow"><span className="fe-icon" style={{ fontSize: "16px" }}>quiz</span> Pricing questions</span>
            <h2 className="mk-h2">Straight answers about what you pay.</h2>
          </div>
      
          <div className="mk-faq">
            <div className="mk-faq__item" data-open="false">
              <button className="mk-faq__q">If I cancel, what happens to my documents?<span className="fe-icon mk-faq__q-icon">expand_more</span></button>
              <div className="mk-faq__a"><div className="mk-faq__a-inner">
                <p>You keep everything you've generated. Your contracts, letters, right-to-work records and Examiner reports are yours — download them before you go, or any time while you're a member.</p>
                <p>We only retain what the law requires us to keep (for example, records we're obliged to hold), and nothing more. We'll tell you plainly what that is when you cancel.</p>
              </div></div>
            </div>
            <div className="mk-faq__item" data-open="false">
              <button className="mk-faq__q">Do I really not need a card for the trial?<span className="fe-icon mk-faq__q-icon">expand_more</span></button>
              <div className="mk-faq__a"><div className="mk-faq__a-inner">
                <p>Correct. The 7-day free trial asks for no card and takes no payment. You only enter payment details if you choose to carry on after the trial — there's no automatic charge, and nothing to cancel if you don't.</p>
              </div></div>
            </div>
            <div className="mk-faq__item" data-open="false">
              <button className="mk-faq__q">Is it really monthly only — no annual contract?<span className="fe-icon mk-faq__q-icon">expand_more</span></button>
              <div className="mk-faq__a"><div className="mk-faq__a-inner">
                <p>Yes. Every plan is billed monthly, with no annual lock-in and no minimum term. You can cancel any time and you won't be charged again after that.</p>
              </div></div>
            </div>
            <div className="mk-faq__item" data-open="false">
              <button className="mk-faq__q">What counts as an employee for the plan limits?<span className="fe-icon mk-faq__q-icon">expand_more</span></button>
              <div className="mk-faq__a"><div className="mk-faq__a-inner">
                <p>Anyone you employ and monitor on your dashboard. Starter covers up to 3 employees, Launch up to 5, and Growth up to 15. If your team grows past your plan, we'll simply prompt you to move up — you're never cut off mid-hire.</p>
              </div></div>
            </div>
            <div className="mk-faq__item" data-open="false">
              <button className="mk-faq__q">Can I change plan later?<span className="fe-icon mk-faq__q-icon">expand_more</span></button>
              <div className="mk-faq__a"><div className="mk-faq__a-inner">
                <p>Any time, in a couple of taps. Move up when you take on another hire, or move down if your team shrinks — the change takes effect from your next monthly bill, and all your documents come with you.</p>
              </div></div>
            </div>
            <div className="mk-faq__item" data-open="false">
              <button className="mk-faq__q">Which plan do I need if I'm hiring for the very first time?<span className="fe-icon mk-faq__q-icon">expand_more</span></button>
              <div className="mk-faq__a"><div className="mk-faq__a-inner">
                <p>Launch. It includes the full first-hire journey — checking employment status, registering for PAYE, setting up a pension and insurance, generating a verified contract and running the right-to-work check. Starter is for businesses that already employ people and only need ongoing compliance.</p>
              </div></div>
            </div>
            <div className="mk-faq__item" data-open="false">
              <button className="mk-faq__q">What if I have more than 15 employees?<span className="fe-icon mk-faq__q-icon">expand_more</span></button>
              <div className="mk-faq__a"><div className="mk-faq__a-inner">
                <p>Get in touch. FirstEmployer is built for first-time and micro-employers, so larger teams sit outside our standard plans — but we'll talk you through the right option rather than leave you guessing.</p>
              </div></div>
            </div>
          </div>
        </div>
      </section>
      
      {/* ============ FINAL CTA ============ */}
      <section className="mk-final">
        <div className="mk-wrap mk-final__inner">
          <h2 className="mk-final__h">Start free. Pay when you're ready to hire.</h2>
          <p className="mk-final__p">A 7-day trial with no card, then £{v.launchPrice} a month — not £2,000 up front.</p>
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
