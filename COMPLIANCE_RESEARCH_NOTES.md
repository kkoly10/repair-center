# Compliance Research Notes — Pre-Beta Launch

**Date:** May 2026
**Author:** Engineering team (with AI assistance)
**Status:** Draft — **NOT attorney-reviewed**

> **Critical disclaimer:** Nothing in this document, or any of the legal/policy pages it informs, is legal advice. All compliance copy added to the repository is a draft. Every document referenced here should be reviewed by a qualified attorney licensed in the relevant jurisdiction before public launch.

---

## Why this document exists

RepairCenter is converting from a single-shop website to a multi-tenant SaaS platform serving independent repair shops. The product is approaching beta. Before public launch we need to:

1. Separate the legal model of "the platform" from "the repair shop tenant" from "the end customer."
2. Reduce the risk of public marketing claims being challenged.
3. Reduce the risk of platform-level liability for repair outcomes performed by shops we do not control.
4. Provide draft policy pages that can be reviewed by an attorney rather than starting from a blank page.

The remainder of this document summarizes what was researched, what the open sources say, what assumptions we made, and what changes we landed in the repo as a result.

---

## A. SaaS platform legal model

### What we learned
- Stripe documents the merchant of record distinction clearly: in a typical Stripe Connect SaaS setup, the connected accounts (i.e. the shops on our platform) are the merchants of record. Stripe itself is the payment service provider, not the merchant of record, for those payments. ([Stripe docs — merchant of record in a Connect integration](https://docs.stripe.com/connect/merchant-of-record))
- Stripe's own SaaS-platform guide reinforces that the platform's terms and the connected account's storefront must "clearly identify" which party the customer is buying from. ([Stripe docs — build a SaaS platform](https://docs.stripe.com/connect/saas))
- HubSpot's public Data Processing Agreement is a useful real-world template for a SaaS provider acting as a processor on behalf of its customers. ([HubSpot DPA](https://legal.hubspot.com/dpa))

### Assumptions we made
- For repair payments collected by shops, the **shop is the merchant of record / seller of services**, even when Stripe is used through our platform. Today we are using shop-owned Stripe accounts (or manual modes); Stripe Connect is deferred. The terms still need to read that way so we are not on the hook for refunds, chargebacks, or repair disputes between a shop and its customer.
- For platform SaaS subscriptions (the $29/mo shop fee), **RepairCenter is the seller**. Those payments are the only place RepairCenter itself is the merchant of record today.

### What we changed
- New `app/platform-terms/page.js` (terms between RepairCenter and a shop).
- Rewrote `app/terms/page.js` to a platform-aware model that explains the three parties (platform / shop / customer) and which party is responsible for what.
- New `app/shop-responsibility/page.js` — customer-facing page that explains repairs are performed by independent shops, not by the platform.
- Added a disclaimer footer to the for-shops page softening the "only platform that..." language.

---

## B. Privacy and data security

### What we learned
- **FTC small-business guidance**: the FTC publishes free guides on collecting only what you need, keeping it safe, and disposing of it securely. ([FTC — Protecting Personal Information](https://www.ftc.gov/business-guidance/resources/protecting-personal-information-guide-business-0))
- **FTC Safeguards Rule** notification: financial-institution-style breach reporting now requires notice within 30 days for breaches of 500+ records. We are not a financial institution today, but the structure is informative. ([FTC Safeguards Rule notification](https://www.ftc.gov/business-guidance/blog/2024/05/safeguards-rule-notification-requirement-now-effect))
- **CCPA/CPRA**: applies to for-profits doing business in California that meet at least one of: $25M+ in annual revenue, 100K+ California consumers/households per year, or 50%+ revenue from selling/sharing personal info. We do not meet those thresholds today. ([IAPP CCPA applicability](https://iapp.org/news/a/does-the-ccpa-as-modified-by-the-cpra-apply-to-your-business))
- **VCDPA** (Virginia): applies at 100K consumers/year, or 25K consumers + 50% revenue from selling personal data. We do not meet those thresholds today. ([Office of the AG of Virginia — VCDPA summary PDF](https://www.oag.state.va.us/consumer-protection/files/tips-and-info/Virginia-Consumer-Data-Protection-Act-Summary-2-2-23.pdf)) ([Code of Virginia — Ch. 53](https://law.lis.virginia.gov/vacodefull/title59.1/chapter53/))
- **GDPR controller vs processor**: SaaS providers are almost always processors with respect to customer data, and controllers only for limited internal purposes (e.g. their own analytics, their own marketing list). ([Maybrook — SaaS DPA elements](https://maybrooklaw.com/saas-agreements-key-data-protection-elements-for-saas-providers/)) ([Cloud Software Association — SaaS data, privacy, GDPR](https://www.cloudsoftwareassociation.com/2020/08/20/data-privacy-and-gdpr-for-saas-partnerships/))

### Assumptions we made
- We **probably do not currently meet** CCPA/CPRA, VCDPA, or GDPR Article 3 thresholds. But because we have customers in many states and could acquire EU/UK traffic, the privacy policy is written to describe core rights anyway, with threshold disclaimers. This is a low-cost, defensive move.
- For shop-customer data, **shops are the controller / business** and **RepairCenter is the processor / service provider**. We made that explicit in the new privacy policy.
- Shops with their own compliance obligations (very large multi-shop chains, etc.) are responsible for posting their own privacy notice and handling their own customer DSAR requests. We will help route requests but we will not be the only party answering them.

### What we changed
- Rewrote `app/privacy/page.js` to describe RepairCenter as the SaaS platform and to enumerate the data categories actually collected (account data, staff users, customer contact data, device/repair data, photos, messages, appointment data, payment metadata, analytics/logs).
- Made data sharing explicit by sub-processor: Supabase (database), Stripe (payments), Resend (email), Twilio (SMS), Vercel (hosting).
- Replaced the previous "Fredericksburg, VA" mailing address and `privacy@repaircenter.example` placeholders with explicit `[contact email]` placeholders that the operator can configure before launch. (Some former placeholders are flagged in the "remaining items" section below.)
- Added a note that shops may need to post their own privacy notice if their volume or jurisdiction requires it.

---

## C. Payments and billing

### What we learned
- Stripe is a payment service provider, **not** a merchant of record, for normal Stripe and most Stripe Connect setups. The seller responsibility stays with the business. ([Stripe — What is a merchant of record](https://stripe.com/resources/more/merchant-of-record))
- For SaaS platforms with Connect: connected accounts (shops) are the merchants of record for their customers' payments. ([Stripe docs — merchant of record in Connect](https://docs.stripe.com/connect/merchant-of-record)) ([Stripe SSA — General Terms](https://stripe.com/legal/ssa))

### Assumptions we made
- Today, shops connect their own Stripe accounts or run manual payment modes. **Shops are the seller and merchant of record** for repair payments. RepairCenter is **the seller and merchant of record only for SaaS subscription payments**.
- This is true today and we intend to keep it true even after Stripe Connect lands.

### What we changed
- `app/terms/page.js` and `app/platform-terms/page.js` both state plainly that the shop is responsible for repair charges, refunds, chargebacks, sales tax, and payment-related customer service unless RepairCenter is itself the repair shop being used.
- `app/shop-responsibility/page.js` makes the same statement in customer-facing language.

---

## D. Reviews and testimonials

### What we learned
- The **FTC's final Rule on Consumer Reviews and Testimonials** went into effect October 21, 2024. Penalties up to $53,088 per violation. ([FTC announcement](https://www.ftc.gov/news-events/news/press-releases/2024/08/federal-trade-commission-announces-final-rule-banning-fake-reviews-testimonials)) ([FTC Q&A](https://www.ftc.gov/business-guidance/resources/consumer-reviews-testimonials-rule-questions-answers))
- Key prohibitions: fake reviews, paid reviews with sentiment conditions, undisclosed insider reviews, review suppression via threats, company-controlled "independent" review sites, and fake social-media indicators.

### Assumptions we made
- Our review request emails are sent to **every customer** whose repair has shipped, regardless of expected sentiment. We do not filter for happy customers. ✓ Compliant.
- We do not offer any incentive in exchange for a positive review. ✓ Compliant.
- We do not (and must not) generate or buy reviews. ✓ Compliant.
- Reviews displayed to admins are stored exactly as the customer submitted them. We do not edit or suppress them.

### What we changed
- Added a code comment in `app/api/review/[quoteId]/route.js` and `lib/followUpEmails.js` referencing the FTC rule and the no-incentive / neutral-request requirement, so future contributors are reminded.
- No change to the email template itself — it is already neutral.
- The "tap a star" UX uses the **same URL pattern for every rating**, so the customer can rate 1 or 5 with equal effort. We confirmed there is no separate "happy path" for high ratings.

---

## E. Warranties and repair policies

### What we learned
- **Magnuson-Moss Warranty Act** governs written warranties on consumer products. It requires the warranty be written in clear language, that consumer responsibilities be stated, and prohibits disclaiming implied warranties when a written warranty is offered. ([FTC — Businessperson's Guide to Federal Warranty Law](https://www.ftc.gov/business-guidance/resources/businesspersons-guide-federal-warranty-law)) ([16 CFR Part 700](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-G/part-700))
- Magnuson-Moss does not require a product to have a warranty. If a shop chooses not to offer one, that is allowed (subject to state implied-warranty law).

### Assumptions we made
- Each shop sets its own warranty terms. RepairCenter does not provide a platform-backed warranty.
- The platform's job is to (a) let shops state their warranty in the estimate and tracking flow, (b) send the optional 7-day-before-expiry reminder, and (c) make clear to customers that warranty terms come from the shop.

### What we changed
- Removed the hard-coded "90-day standard, 30-day software, 180-day extended" warranty language from `app/terms/page.js` and replaced it with a description that says warranty terms are set by the shop.
- `app/shop-responsibility/page.js` explicitly tells customers to confirm warranty terms with the shop before mailing in a device.

---

## F. Subscription billing and cancellation

### What we learned
- The FTC's **Click-to-Cancel Rule** (final October 2024) required cancellation to be as easy as signup, plus clear disclosure of trial-to-paid terms. The rule was **vacated by the Eighth Circuit on July 8, 2025, on procedural grounds** — but the underlying FTC Act §5 prohibition on deceptive/unfair practices remains in force. ([FTC announcement](https://www.ftc.gov/news-events/news/press-releases/2024/10/federal-trade-commission-announces-final-click-cancel-rule-making-it-easier-consumers-end-recurring)) ([Eighth Circuit decision summary](https://www.retailconsumerproductslaw.com/2025/07/eighth-circuit-cancels-click-to-cancel/))
- Several states (CA, NY, IL, others) have their own auto-renewal laws that impose similar requirements regardless of the federal rule's status.

### Assumptions we made
- Even though the federal rule was vacated, the deceptive/unfair-practices floor still applies. We should treat the FTC's published expectations as a sensible bar to meet.
- We need: clear trial length, clear renewal price, clear cancellation method, and we must not imply automatic billing without a payment method on file.

### What we changed
- `/for-shops` page now uses **"Founder Beta Plan — $29/mo, 14-day free trial"** and states explicitly that no credit card is required during the trial; the customer must add a card to continue past the trial.
- Cancellation path (Stripe Customer Portal via `/admin/billing`) is described in the `app/platform-terms/page.js` page.
- `app/admin/billing/page.js` already shows trial countdown and renewal status; no change needed there.

---

## G. Marketing claims

### What we learned
- Unsupported superlatives ("only", "best", "lowest priced") are a frequent target of FTC §5 actions when they cannot be substantiated.
- Competitor pricing claims should be dated and sourced.

### What we changed
- Softened "The only repair platform where mail-in is not an afterthought" → "Built with mail-in workflows at the center."
- Softened the pricing-card heading "One plan. Everything included." → "Founder Beta Plan — everything included during beta."
- Added "Founder Beta — terms may change as we add public tiers" qualifier next to the price.
- Added a "Based on publicly available pricing as of May 2026. Features and prices may change." disclaimer under the competitor comparison table.

---

## Open items that still need attorney review before public launch

1. **Governing law and venue.** We are using Virginia as a placeholder because the founder is in Virginia. An attorney should confirm whether VA, DE, or another jurisdiction is best for the SaaS entity.
2. **Indemnification and limitation of liability clauses.** The drafts are conservative but have not been litigated against real shops or real customers.
3. **Shop Terms (`/platform-terms`)** between RepairCenter and shops — the entire agreement template needs review.
4. **Customer Terms (`/terms`)** — the platform-aware rewrite needs review, especially the disclaimer of repair responsibility.
5. **Privacy Policy** — needs review for any state-specific notice requirements (especially CA, CO, VA, CT, UT).
6. **Sub-processor list and DPA** — we list our sub-processors in the privacy policy but we have not signed customer-facing DPAs with shops, nor formal DPAs with each sub-processor on our side.
7. **Refund / chargeback responsibility** — the drafts assign these to the shop. Attorney should confirm that holds up under Stripe Connect when we add it.
8. **Beta disclaimer / SLA disclaimers** — drafts say the platform is provided "as is" during beta. Acceptable in most cases but worth reviewing.

## Placeholder values that still need to be set before launch

These appear with clear `[bracket]` markers in the documents so they are easy to find:

- `[support email]` and `[privacy email]` — where customers and shops should write
- `[platform mailing address]` — for legal notices
- `[business entity name]` — the legal entity that owns RepairCenter
- The previous "123 Repair Center Way, Suite 200, Fredericksburg, VA 22401" address and the `privacy@repaircenter.example` and `legal@repaircenter.example` placeholders have been replaced with bracket placeholders.

---

## Sources

### SaaS legal model and payments
- [Stripe docs — merchant of record in a Connect integration](https://docs.stripe.com/connect/merchant-of-record)
- [Stripe docs — build a SaaS platform](https://docs.stripe.com/connect/saas)
- [Stripe docs — introduction to SaaS platforms and marketplaces with Connect](https://docs.stripe.com/connect/saas-platforms-and-marketplaces)
- [Stripe — what is a merchant of record](https://stripe.com/resources/more/merchant-of-record)
- [Stripe Services Agreement (SSA) general terms](https://stripe.com/legal/ssa)
- [HubSpot — Data Processing Agreement (DPA example)](https://legal.hubspot.com/dpa)

### Privacy and data security
- [FTC — Protecting Personal Information: A Guide for Business](https://www.ftc.gov/business-guidance/resources/protecting-personal-information-guide-business-0)
- [FTC — Privacy and Security business guidance hub](https://www.ftc.gov/business-guidance/privacy-security)
- [FTC — Safeguards Rule notification requirement now in effect](https://www.ftc.gov/business-guidance/blog/2024/05/safeguards-rule-notification-requirement-now-effect)
- [IAPP — Does the CCPA as modified by the CPRA apply to your business?](https://iapp.org/news/a/does-the-ccpa-as-modified-by-the-cpra-apply-to-your-business)
- [Code of Virginia — Chapter 53 — Consumer Data Protection Act](https://law.lis.virginia.gov/vacodefull/title59.1/chapter53/)
- [Office of the Attorney General of Virginia — VCDPA summary](https://www.oag.state.va.us/consumer-protection/files/tips-and-info/Virginia-Consumer-Data-Protection-Act-Summary-2-2-23.pdf)
- [Maybrook — SaaS agreements: key data protection elements](https://maybrooklaw.com/saas-agreements-key-data-protection-elements-for-saas-providers/)
- [Cloud Software Association — Data, privacy, and GDPR for SaaS partnerships](https://www.cloudsoftwareassociation.com/2020/08/20/data-privacy-and-gdpr-for-saas-partnerships/)

### Reviews and testimonials
- [FTC — Federal Trade Commission Announces Final Rule Banning Fake Reviews and Testimonials](https://www.ftc.gov/news-events/news/press-releases/2024/08/federal-trade-commission-announces-final-rule-banning-fake-reviews-testimonials)
- [FTC — Consumer Reviews and Testimonials Rule: Questions and Answers](https://www.ftc.gov/business-guidance/resources/consumer-reviews-testimonials-rule-questions-answers)
- [Federal Register — Trade Regulation Rule on the Use of Consumer Reviews and Testimonials](https://www.federalregister.gov/documents/2024/08/22/2024-18519/trade-regulation-rule-on-the-use-of-consumer-reviews-and-testimonials)

### Warranties
- [FTC — Businessperson's Guide to Federal Warranty Law](https://www.ftc.gov/business-guidance/resources/businesspersons-guide-federal-warranty-law)
- [eCFR — 16 CFR Part 700 — Interpretations of Magnuson-Moss Warranty Act](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-G/part-700)

### Subscription billing and cancellation
- [FTC — Final "Click-to-Cancel" Rule announcement](https://www.ftc.gov/news-events/news/press-releases/2024/10/federal-trade-commission-announces-final-click-cancel-rule-making-it-easier-consumers-end-recurring)
- [FTC — Click to Cancel business guidance](https://www.ftc.gov/business-guidance/blog/2024/10/click-cancel-ftcs-amended-negative-option-rule-what-it-means-your-business)
- [Eighth Circuit voids FTC 'Click to Cancel' rule (July 2025) — Consumer Finance Monitor](https://www.consumerfinancemonitor.com/2025/07/23/eighth-circuit-voids-ftc-click-to-cancel-rule/)
- [Retail & Consumer Products Law Observer — Eighth Circuit Cancels Click-to-Cancel](https://www.retailconsumerproductslaw.com/2025/07/eighth-circuit-cancels-click-to-cancel/)
