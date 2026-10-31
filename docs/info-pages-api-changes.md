# Client-care pages: placeholder content and API changes

**Scope:** Terms & conditions, Privacy policy, Shipping & returns, FAQs and Contact us, rebuilt from
[design-mockups/info-pages](../design-mockups/info-pages/index.html).
**Code:** shared pieces in [src/components/ClientCare/](../src/components/ClientCare/); pages in `src/app/{terms-and-conditions,privacy-policy,returns-shipping,faqs,contactpage}`.
**Last updated:** 14 Oct 2026

Priority: 🔴 before launch · 🟠 soon · ⚪ later

## 1. Content to confirm

| # | What | Where | Today | Priority |
|---|---|---|---|---|
| C1 | **Client-care email** | [careInfo.ts](../src/components/ClientCare/careInfo.ts) `CARE.email` | `care@pendyora.com` (placeholder; the old pages used an Ashclair address, removed) | 🔴 |
| C2 | **Client-care phone** | `CARE.phone` | Empty, so phone is hidden everywhere. The old Ashclair number was removed. Fill it in to show it on Contact and in the policies. | 🔴 |
| C3 | **Opening hours** | `CARE.hours` and `isOpenNow()` in the contact page | Mon–Fri 9am–5pm PST, kept from the old page. The "We're online now" dot uses these hours. | 🟠 |
| C4 | **Return address** | Shipping & returns → "How to return an order" | The old page had the address commented out. The page now says "Contact client care for the return address". Add the real address when ready. | 🔴 |
| C5 | **Policy wording** | Terms, Privacy, Shipping pages | The **existing legal text** was kept and restructured; "Ashclair" was replaced with "Pendyora". Have it reviewed for the new brand. | 🔴 |
| C6 | **Shipping facts** | Shipping & returns cards and table | From the old page: free USPS over $100, UPS 2nd day $25 / overnight $35, signature over $80, 30-day returns, 10% restocking fee. These **conflict** with other placeholders on the site ("Free insured shipping on every order" in the announcement bar and product page). Pick one policy. | 🔴 |
| C7 | **"Last updated" date** | Policy title bands | Not shown, because the real date isn't known. Pass `updated="Last updated …"` to `CareLayout` once confirmed. | ⚪ |

## 2. API changes

| # | Need | Today | Proposed | Priority |
|---|---|---|---|---|
| A1 | **FAQ topics** | `/cms/type/2` returns a flat list of `{ question, answer }` | Add `category` per question. The page already groups by it and shows a topic list when present. | 🟠 |
| A2 | **Contact topic as its own field** | The chosen topic is sent as `subject` (e.g. "An existing order · PD-10482") | Optional: accept `topic` and `order_number` fields on `POST /contact-us` so client care can filter. | ⚪ |
| A3 | **Policy pages from the CMS** | Policy text is in code | Optional: serve Terms / Privacy / Shipping from the CMS like FAQs, with an `updated_at` date. | ⚪ |

## 3. Behaviour changes to know about

- Contact: after sending, the form now shows a thank-you message in place, instead of a pop-up and a redirect to the homepage.
- Contact: the free-text subject was replaced by six topic buttons. "An existing order" asks for the order number.
- FAQs: an empty CMS response shows "Our FAQs are being updated" instead of a 404 page.
