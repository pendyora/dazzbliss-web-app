# Client-care pages: placeholder content and API changes

**Scope:** Terms & conditions, Privacy policy, Shipping & returns, FAQs and Contact us, rebuilt from the
[info-pages mockup](https://github.com/pendyora/pendyora-web-app/blob/shruti/mockups/design-mockups/info-pages/index.html).
**Mockups:** the design mockups live in the `pendyora-web-app` repo (branch `shruti/mockups`, folder `design-mockups/`), not in this repo.
**Code:** shared pieces in [src/components/ClientCare/](../src/components/ClientCare/) (`CareLayout.tsx`, `PolicyDoc.tsx`, `careInfo.ts`); pages in `src/app/{terms-and-conditions,privacy-policy,returns-shipping,faqs,contactpage}` (FAQ list `faqs/Faqs.tsx`, contact form `contactpage/ContactpageGroup2782.tsx`).
**Last updated:** 31 Oct 2026 (statuses checked against this repo's `design-merge` branch and `latest-backend-main`)

Priority: 🔴 before launch · 🟠 soon · ⚪ later

**Status** values: `Done (in latest code)` · `Partly done — <what's missing>` · `Still needed` · `No longer applies — <why>` · `Check`.
Backend paths are in `latest-backend-main/`.

## 1. Content to confirm

| # | What | Where | Today | Priority | Status |
|---|---|---|---|---|---|
| C1 | **Client-care email** | [careInfo.ts](../src/components/ClientCare/careInfo.ts) `CARE.email` | `care@pendyora.com` (placeholder, to change in brand cleanup; the old pages used an Ashclair address, removed) | 🔴 | Still needed (content) — needs the real Dazzbliss mailbox. |
| C2 | **Client-care phone** | `CARE.phone` | Empty, so phone is hidden everywhere. Fill it in to show it on Contact and in the policies. | 🔴 | Still needed (content). |
| C3 | **Opening hours** | `CARE.hours` and `isOpenNow()` in `ContactpageGroup2782.tsx` | Mon–Fri 9am–5pm PST, kept from the old page. The "We're online now" dot uses these hours (hardcoded separately in `isOpenNow()`; keep both in sync). | 🟠 | Still needed (content) — also conflicts with the appointment page ("every day"), see V3 in [account-search-appointment-api-changes.md](account-search-appointment-api-changes.md). |
| C4 | **Return address** | Shipping & returns → "How to return an order" | The page says "Contact client care for the return address before you ship." | 🔴 | Still needed (content). |
| C5 | **Policy wording** | Terms, Privacy, Shipping pages | The **existing legal text** was kept and restructured; "Ashclair" was replaced with "Pendyora" in the code. The text and page titles still say "Pendyora" (to change in brand cleanup). | 🔴 | Still needed (content) — change to Dazzbliss and have it legally reviewed. |
| C6 | **Shipping facts** | Shipping & returns cards and table | From the old page: free USPS over $100, UPS 2nd day $25 / overnight $35, signature over $80, 30-day returns, 10% restocking fee. These **conflict** with other copy on the site: bag "Complimentary shipping on every order" (`cart.tsx`), PDP "Free shipping and returns" (`PDPPage.tsx`), `WhyAllorya` "Free Shipping & Returns". Pick one policy. | 🔴 | Still needed (content) — also needs the shipping work in [redesign-dummy-content-and-api-changes.md](redesign-dummy-content-and-api-changes.md) (C1). |
| C7 | **"Last updated" date** | Policy title bands | Not shown, because the real date isn't known. Pass `updated="Last updated …"` to `CareLayout` once confirmed. | ⚪ | Still needed — `CareLayout` supports `updated`; no page passes it. |

## 2. API changes

| # | Need | Today | Proposed | Priority | Status |
|---|---|---|---|---|---|
| A1 | **FAQ topics** | `/cms/type/2` returns a flat list of `{ question, answer }` | Add `category` per question. The page already groups by it and shows a topic list when present. | 🟠 | Partly done — frontend groups by `category` (`Faqs.tsx`). The CMS stores FAQ items as JSON (`src/models/cms.model.ts` `content`), so a `category` per item passes through with no migration; the admin FAQ editor must let staff set it (Check the admin app). |
| A2 | **Contact topic as its own field** | The chosen topic is sent as `subject` (e.g. "An existing order · PD-10482"), with `cloudflareTurnstileToken` | Optional: accept `topic` and `order_number` fields on `POST /contact-us` so client care can filter. | ⚪ | Still needed — `src/models/contactUs.model.ts` has only `full_name`, `email`, `phone`, `subject`, `message`, `status`; unknown keys are dropped. |
| A3 | **Policy pages from the CMS** | Policy text is in code | Optional: serve Terms / Privacy / Shipping from the CMS like FAQs, with an `updated_at` date. | ⚪ | Still needed — CMS types are only 1 About us, 2 FAQ, 3 Jewelry care. |

## 3. Behaviour changes to know about

| Change | Status |
|---|---|
| Contact: after sending, the form shows a thank-you message in place, instead of a pop-up and a redirect to the homepage. | Done (in latest code) |
| Contact: the free-text subject was replaced by six topic buttons. "An existing order" asks for the order number. | Done (in latest code) |
| FAQs: an empty CMS response shows "Our FAQs are being updated" instead of a 404 page. | Done (in latest code) |
| Contact (new since the first version): the form sends a Cloudflare Turnstile token; the backend checks it (`src/middleware/verifyCloudflareTurnstile.ts`) only when `CLOUDFLARE_TURNSTILE_ENFORCE=true`. | Done (in latest code) |
