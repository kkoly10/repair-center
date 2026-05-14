# Legal Review TODO

Questions and items to discuss with a qualified attorney before public launch of the RepairCenter SaaS platform.

This file is the **agenda for the legal review meeting**. Each line is something the operator should not answer alone.

---

## SaaS structure

1. Are the **Platform Terms** (`/platform-terms`) adequate to govern the SaaS relationship between RepairCenter and the repair shops that subscribe?
2. Are the **Customer Terms** (`/terms`) clear that the repair shop, not RepairCenter, is the seller of the repair service?
3. Is the disclaimer on `/shop-responsibility` sufficient to prevent a customer from successfully claiming RepairCenter is responsible for a repair gone wrong?
4. Should we have shops explicitly accept the Platform Terms during signup (e.g. checkbox + signature)? Today acceptance is implied by signing up.

## Payments and merchant of record

5. Today shops use their own Stripe accounts or manual payment modes. The terms say the **shop is the merchant of record** for repair payments. Does that hold up?
6. When we add Stripe Connect, can we keep the same merchant-of-record model (connected accounts are MoR) per Stripe&apos;s documentation? Are any additional terms or disclosures required?
7. Are the **refund and chargeback** responsibilities clear — i.e. that they sit with the shop, not the platform — and enforceable?
8. Should the platform terms include an anti-circumvention clause prohibiting shops from using the platform to facilitate payment outside of disclosed payment modes?

## Privacy and data

9. Are the controller/processor (or business/service provider) roles described in `/privacy` correct for our actual data flows?
10. Should we have a separate **Data Processing Addendum (DPA)** with shops, signed at signup, in addition to the platform terms?
11. We list our sub-processors (Supabase, Stripe, Resend, Twilio, Vercel). Should we have formally signed DPAs with each of them?
12. Are we required to publish a **Sub-Processor List with notification on change** like enterprise SaaS does?
13. State privacy laws — VCDPA, CCPA, CPRA, CTDPA, CPA, UCPA — do any apply to RepairCenter directly today, or only to certain shops based on volume?
14. Cookie / tracking technologies — do we need a cookie banner today, or can we rely on the privacy policy alone given that we do not run third-party ad trackers?

## Reviews

15. Do our **review collection email** and **review storage** practices satisfy the FTC&apos;s Consumer Reviews and Testimonials Rule (effective Oct 21, 2024)? Anything missing?
16. If a shop suppresses negative reviews internally (e.g. by ignoring them), does the platform have any obligation, or is that the shop&apos;s problem?
17. Should we add an explicit prohibition in the Platform Terms against shops asking only happy customers to leave reviews?

## Warranties

18. Each shop sets its own warranty. We do not provide a platform-backed warranty. Is the language in `/terms` and `/shop-responsibility` sufficient to communicate that to customers under the **Magnuson-Moss Warranty Act** and state warranty laws?
19. Are we obligated to require shops to **post their warranty terms in writing** through our platform, given Magnuson-Moss?
20. Should we add a placeholder for a shop&apos;s warranty in the estimate flow that defaults to "warranty terms set by the shop — ask before approving"?

## Subscription billing and cancellation

21. The FTC Click-to-Cancel rule was vacated in July 2025 on procedural grounds. Are we still expected to comply with the deceptive/unfair practices floor? Are there state laws (CA, NY, IL, others) that impose equivalent requirements regardless?
22. Is our **cancellation path** (Stripe Customer Portal accessible from `/admin/billing`) sufficient, or should we provide an in-app cancel button as well?
23. Is the **trial-to-paid transition** clear enough? Today: no card required for trial; expired trial automatically suspends; user must add card to resume.
24. Is **past-due → suspended** handled appropriately? Today: failed payment marks `past_due` and continues to allow access; full suspension only happens after subsequent failures or trial expiry without payment.
25. Pricing changes for Founder Beta accounts — what notice are we obligated to give, and is "reasonable advance notice" defensible language?

## Consumer protection

26. Do any **state right-to-repair laws** (NY, MA, MN, CA, OR, etc.) apply to RepairCenter or to the shops on the platform? In particular, do any require specific disclosures to consumers about replacement parts?
27. Are we expected to have an **accessibility statement** (WCAG / ADA compliance) given we are a consumer-facing platform?
28. Are we required to register as a **service mark** before using "RepairCenter" publicly?

## Marketing claims

29. Is the comparison table on `/for-shops` (with the "based on publicly available pricing as of May 2026" disclaimer) safe enough? Anything else we should add to soften it?
30. Can we keep saying "Tamper-proof customer links" in the comparison table? The implementation uses HMAC tokens which are reasonably described as tamper-evident, but "tamper-proof" is a strong word.
31. Is "Built with mail-in workflows at the center" defensible if challenged? (We believe it is, based on actual product design.)

## Indemnification, liability, and disputes

32. Is the **limitation of liability** clause in `/platform-terms` enforceable in Virginia and in other states where shops are located?
33. Is the **indemnification** clause in `/platform-terms` enforceable, and is it strong enough?
34. Should we require **arbitration with a class-action waiver**, or is informal-then-litigation in Virginia courts the right default?
35. Governing law and venue — should we use Virginia (where the founder is) or Delaware (common for SaaS)?

## Multi-jurisdiction questions

36. We may have customers and shops in many states and could acquire international traffic. Are there **states or countries** where we need additional terms or where we should restrict access?
37. **EU/UK GDPR** — do we ever expect EU/UK-resident customers? If yes, do we need a UK representative, an EU representative, or both?
38. **Quebec** — do we need a French-language version of the policies if a Quebec-based shop signs up?

## Other open items

39. **Termination data export** — we say users can export via CSV before termination. Is that enough for data portability rights?
40. **Breach notification timing** — what is our committed timeline for notifying affected shops if there is a security incident on the platform?
41. **Insurance** — do we need errors-and-omissions or cyber liability insurance before launch?
42. **Employee / contractor access** — should we add language to the privacy policy and platform terms describing how internal access to customer data is controlled?
43. **Tax (US sales tax on SaaS)** — Is the $29 SaaS subscription taxable in any of the states where we have shops? Should we be collecting and remitting?

---

## What we are explicitly NOT asking the attorney to do

- Approve our copy as "compliant" without changes — we expect substantive feedback.
- Predict outcomes of hypothetical disputes.
- Provide advice on specific shops&apos; legal obligations to their own customers.
