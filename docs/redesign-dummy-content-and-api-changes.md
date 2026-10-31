# Redesign: placeholder content and required API changes

**Scope:** the Pendyora redesign on branch `shruti/plp`: product listing (PLP), product page (PDP), bag, checkout, order confirmation, and sign-in / sign-up / password screens.
**Last updated:** 4 Oct 2026

The new pages look finished, but some of what they show is hardcoded in the frontend or not backed by an API yet. This document lists:

1. **Placeholder content.** Text, offers or claims written into the code. Marketing should confirm it, or it should come from the CMS.
2. **API changes.** Data or endpoints the frontend needs so the placeholder can be replaced, or so a designed feature can be built.
3. **Designed but not built.** Features in the approved mockups that were left out because no API supports them.

### Priority

| Label | Meaning |
|---|---|
| 🔴 **Before launch** | Customers see a promise or offer the business does not deliver yet. Fix it or remove it before going live. |
| 🟠 **Soon** | Works today, but the content is hardcoded where it should be managed, or behaviour depends on an assumption about the API. |
| ⚪ **Later** | Static brand copy or a nice-to-have. Fine to ship as is. |

---

## 1. Summary

| # | Page | Item | Type | Priority |
|---|---|---|---|---|
| A1 | Sign up, Sign in | "10% off your first piece", welcome code sent by email | Placeholder offer | 🔴 |
| A2 | Sign up | Welcome perks (free gift wrapping, birthday surprise, early access, free lifetime cleaning) | Placeholder claims | 🔴 |
| A3 | All auth screens | Poster campaigns (images, headlines, copy, links) | Hardcoded content | 🟠 |
| A4 | Sign in | "Members only" private preview, "early access to launches" | Placeholder claim | 🔴 |
| A5 | Reset password | Detecting an expired or used reset link | API assumption | 🟠 |
| A6 | Reset password | Showing the account email; signing in after the reset | Needs API | ⚪ |
| A7 | Sign up | Newsletter opt-in | Needs API (not built) | 🟠 |
| A8 | Sign in | "Keep me signed in" | Needs API (not built) | ⚪ |
| A9 | Sign up | Text-message consent checkbox is required | Legal check | 🟠 |
| A10 | All auth screens | "Bot verification failed" from the API | API question | 🟠 |
| P1 | PLP | Intro text per category ("recycled gold", "lab-grown and ethically mined diamonds") | Hardcoded claims | 🔴 |
| P2 | PLP | "Fast delivery" badge threshold (`handling_days <= 2`) | Hardcoded rule | ⚪ |
| D1 | PDP | "Free shipping and returns" | Hardcoded claim | 🔴 |
| D2 | PDP | Trust list (finest diamonds, 90-day warranty, expert support, pay later) | Hardcoded claims | 🟠 |
| D3 | PDP | Atelier band ("fourteen pairs of hands", four making stages, image) | Static brand copy | ⚪ |
| D4 | PDP | Engraving font list | Hardcoded list | ⚪ |
| D5 | PDP | "Recently viewed" saved in the browser only | Local only | ⚪ |
| C1 | Bag, Checkout | Shipping shown as "Complimentary"; no shipping cost from the API | Hardcoded value | 🔴 |
| C2 | Bag | Trust list (certified diamonds, worldwide shipping, 30-day returns) | Hardcoded claims | 🔴 |
| C3 | Bag | Payment logos (Visa, Mastercard, Amex, Discover, PayPal, Affirm) | Hardcoded list | 🟠 |
| O1 | Order confirmation | Progress timeline always shows "Being prepared" | Hardcoded status | 🟠 |
| O2 | Order confirmation | "Shipping Charge: Free" | Hardcoded value | 🔴 |

---

## 2. Sign in, sign up and password screens

Routes: `/login`, `/createanaccount`, `/forgotpassword`, `/forgot-password?token=…`
Design reference: [design-mockups/auth/index.html](../design-mockups/auth/index.html)

Every screen is split in two: a **campaign poster** and the form. All poster content is in one file, [src/components/Auth/authPosters.tsx](../src/components/Auth/authPosters.tsx), so it can be changed without touching the pages. Poster images are in `public/images/auth/`.

### Placeholder content, by screen

| Screen | What is placeholder | Where | Priority |
|---|---|---|---|
| **Sign in** (`/login`) | Poster carousel with 3 slides: "The Golden Hour edit" (links to `/collections`), "Say yes, beautifully" bridal (links to `/virtual-appointment`), "The Private Preview, Members only" (links to `/createanaccount`). The "Pendyora · Autumn 2026" tag. | [authPosters.tsx:84](../src/components/Auth/authPosters.tsx#L84) | 🟠 / 🔴 for "Members only" |
| **Sign in** | "Create an account and get 10% off your first piece." under "Join the house" (text comes from the sign-up offer below) | [LoginGroup2722.tsx:141](../src/app/login/LoginGroup2722.tsx#L141) | 🔴 |
| **Sign in** | Benefit list: Faster checkout, Order history & tracking, Wishlist on every device, **Early access to launches** | [LoginGroup2722.tsx](../src/app/login/LoginGroup2722.tsx) (`BENEFITS`) | 🔴 for early access |
| **Create account** (`/createanaccount`) | Offer card: **"10% off your first piece. Join today and we'll email your welcome code. Valid for 30 days on full-price jewelry."** | [authPosters.tsx:121](../src/components/Auth/authPosters.tsx#L121) | 🔴 |
| **Create account** | Perks: **Free gift wrapping, Birthday surprise, Early access to launches, Free lifetime cleaning** | [authPosters.tsx:131](../src/components/Auth/authPosters.tsx#L131) | 🔴 |
| **Create account** | Form intro: "Your welcome code arrives by email." | [CreateanaccountGroup2691.tsx:155](../src/app/createanaccount/CreateanaccountGroup2691.tsx#L155) | 🔴 |
| **Welcome** (after sign-up) | Poster: "You're on the list. The Private Preview…" | [authPosters.tsx:144](../src/components/Auth/authPosters.tsx#L144) | 🔴 |
| **Forgot password** (`/forgotpassword`) and **Check your inbox** | Still-life poster: "Gifts that are kept. Hand-picked pieces **under $500**, wrapped in our signature box **at no cost**." (links to `/giftguide`) | [authPosters.tsx:78](../src/components/Auth/authPosters.tsx#L78) | 🟠 |
| **Set a new password** (`/forgot-password?token=…`) | Poster: "Made to last a lifetime. Every piece comes with **free cleaning, polishing and a stone check**, for as long as you own it." Mobile strip: "Free lifetime cleaning for members." | [authPosters.tsx:176](../src/components/Auth/authPosters.tsx#L176) | 🔴 |
| **Password updated** | Reuses the "Golden Hour edit" poster | [authPosters.tsx:201](../src/components/Auth/authPosters.tsx#L201) | 🟠 |
| **Link expired** | Poster: "A private appointment… Always free." | [authPosters.tsx:207](../src/components/Auth/authPosters.tsx#L207) | 🟠 |

**What to do for each 🔴 item:** either confirm the business offers it (and set up the code or email), or change the copy in `authPosters.tsx`. The sign-in line under "Join the house" updates automatically from the offer card.

### API changes for auth

| # | Need | Current state | Proposed change |
|---|---|---|---|
| A1 | **Welcome offer code** | No code is created or emailed on sign-up. The Welcome screen shows no code. | On successful `POST /user/signup`, create a single-use coupon and email it. Optionally return it so the Welcome screen can show it: `{ data: { …user, welcome_coupon: { code: "WELCOME10", percent: 10, expires_at: "2026-11-03" } } }` |
| A3 | **Campaign content from the CMS** | Hardcoded in `authPosters.tsx` | New endpoint, e.g. `GET /auth-campaigns`, returning per screen (`signin`, `register`, `welcome`, `forgot`, `sent`, `reset`, `updated`, `expired`): `{ kind: "image" \| "offer" \| "still", slides: [{ desktop_image, mobile_image, eyebrow, title, title_accent, body, cta_label, cta_url }], offer?: { value, unit, caption, body, perks[] } }` |
| A5 | **Clear error for an expired or used reset link** | The frontend *guesses*: it treats HTTP 401/403/410, or a message containing "expire", "invalid" or "token", as an expired link and shows the "Link expired" screen. Any other error appears as a message on the form. | Have `POST /user/forgot-password` return a stable code, e.g. `{ status: 410, code: "RESET_TOKEN_EXPIRED" }` or `"RESET_TOKEN_USED"`. Then the frontend can check the code instead of the message text. |
| A6 | **Account email on the reset page** (in the mockup) | Not shown: the token alone doesn't tell the frontend whose account it is. | Optional `GET /user/reset-token?token=…` → `{ email: "s•••••@gmail.com", valid: true }`. This would also let the page show "Link expired" *before* the person types a new password. |
| A6 | **Sign in automatically after the reset** (in the mockup) | The "Password updated" screen asks people to sign in again. | Optionally return the same session payload as `/user/login` from `POST /user/forgot-password`. |
| A6 | **Sign out other devices after a reset** (in the mockup) | Copy removed, not supported. | Invalidate other sessions when the password changes, then we can put the copy back. |
| A7 | **Newsletter opt-in on sign-up** (in the mockup) | Checkbox left out. | Accept `is_subscribed: boolean` on `POST /user/signup`. Login already returns `is_subscribed`. |
| A8 | **"Keep me signed in"** (in the mockup) | Left out. | Accept `remember_me: boolean` on `/user/login` and issue a longer-lived token when it is true. |
| A10 | **"Bot verification failed"** | During testing, `POST /user/forgot-password` returned `400 "Bot verification failed. Please try again."` from an automated browser. | Confirm with backend what this check needs: a captcha token, a header, or nothing for real browsers. The old pages didn't send anything extra either, so this isn't caused by the redesign. |

**Legal check (A9):** the sign-up page keeps the existing **required** checkbox agreeing to automated text messages. The wording now says Pendyora and links to Terms and Privacy. US texting rules usually say SMS consent must not be required to create an account. Please check with legal whether this box should be optional, with a separate required box for Terms and Privacy as in the mockup.

---

## 3. Product listing page (PLP)

Route: `/[jewelryType]` (for example `/rings`, `/all`, `/new-arrivals`)

| # | What is placeholder | Where | Priority | Needed |
|---|---|---|---|---|
| P1 | Intro paragraph beside each category title, hardcoded per category. Every one claims **"recycled gold"** and **"Set with lab-grown and ethically mined diamonds, certified at origin."** Collections use the API description first. | [index.tsx:60](../src/app/%5BjewelryType%5D/index.tsx#L60) | 🔴 | Confirm the claims, or add `description` to the category / jewelry-type API so marketing can manage it. |
| P2 | "Fast delivery" badge: also shown when `handling_days <= 2`, besides the project setting `fastDeliveryDay` | [ProductProfile/index.tsx:753](../src/components/ProductProfile/index.tsx#L753) | ⚪ | Use only the `fastDeliveryDay` setting, or add a `is_fast_delivery` flag per product. |

The editorial promo tiles in the grid, the filters, sorting and product badges ("special product titles") already come from the API.

---

## 4. Product page (PDP)

Route: `/[jewelryType]/premade/…`

| # | What is placeholder | Where | Priority | Needed |
|---|---|---|---|---|
| D1 | **"Free shipping and returns."** under the delivery estimate, and **"Shipping and returns are free."** in the Shipping & returns tab | [PDPPage.tsx:1962](../src/app/%5BjewelryType%5D/premade/PDPPage.tsx#L1962), [PdpDetails.tsx:57](../src/app/%5BjewelryType%5D/premade/pdp/PdpDetails.tsx#L57) | 🔴 | Confirm the policy, or return shipping/returns terms from the project settings API (for example `shipping_policy: { free_shipping: true, free_returns: true, return_days: 30 }`). |
| D2 | Trust list: **Finest diamonds & gemstones, 90-day warranty, Expert support from our jewelers, Shop now, pay later** (carried over from the old "Why us" band) | [PdpAssurance.tsx](../src/app/%5BjewelryType%5D/premade/pdp/PdpAssurance.tsx) | 🟠 | Confirm. The "90-day warranty" should match the warranty plans returned by the API. |
| D3 | Atelier band: "Fourteen pairs of hands, one piece", the four stages (Drawing, Casting, Setting, Finishing) and the model photo. The same claim is on the homepage. | [PdpAtelier.tsx](../src/app/%5BjewelryType%5D/premade/pdp/PdpAtelier.tsx) | ⚪ | Static brand copy. Could come from the CMS later. |
| D4 | Engraving fonts: Arial, Times New Roman, Georgia, Courier New, Verdana, Roboto, Lobster | [PdpEngraving.tsx:9](../src/app/%5BjewelryType%5D/premade/pdp/PdpEngraving.tsx#L9) | ⚪ | Confirm the workshop can engrave these. Could come from the engraving master API alongside `engraving_price`. |
| D5 | "Recently viewed" tab is stored in the browser (`localStorage` key `recentlyViewedProducts`, last 10). It doesn't follow the customer across devices. | [useRecentlyViewed.ts](../src/app/%5BjewelryType%5D/premade/pdp/useRecentlyViewed.ts) | ⚪ | Optional: `GET/POST /user/recently-viewed` for signed-in customers. |

Price, options, the delivery estimate, warranty and appraisal plans, the engraving price, suggestions and reviews (Yotpo) already come from APIs.

---

## 5. Bag and checkout

Routes: `/cart`, `/checkout`

| # | What is placeholder | Where | Priority | Needed |
|---|---|---|---|---|
| C1 | Order summary always shows **"Shipping: Complimentary"**. No shipping cost is calculated or charged. The checkout page title also says "worldwide shipping available". | [OrderSummary/index.tsx:112](../src/components/OrderSummary/index.tsx#L112) | 🔴 | Confirm free shipping everywhere, or return a shipping amount in the cart / order total API (for example `shipping: { amount: 0, label: "Complimentary" }`) and show that. |
| C2 | Trust list: **Certified diamonds** (lab-grown and ethically mined, certified at origin), **Secure payment**, **Worldwide shipping** (complimentary on every order), **30-day returns** | [cart.tsx:28](../src/app/cart/cart.tsx#L28) | 🔴 | Confirm the policies (30 days needs to match the returns page). |
| C3 | Payment logos: VISA, MASTERCARD, AMEX, DISCOVER, PAYPAL, AFFIRM · US | [cart.tsx:34](../src/app/cart/cart.tsx#L34) | 🟠 | Must match the payment methods actually enabled. Could come from the payment settings API. |

Coupons, totals, tax, engraving, appraisal and warranty lines already come from APIs (`useOrderTotals`).

---

## 6. Order confirmation

Route: `/ordersuccesfull`

| # | What is placeholder | Where | Priority | Needed |
|---|---|---|---|---|
| O1 | Order timeline: "Order placed" uses the real date and "Arrives" uses the shipping dates from the order, but the middle step **"Being prepared" is always shown as the current step** | [ThankYouSection.tsx:271](../src/app/ordersuccesfull/ThankYouSection.tsx#L271) | 🟠 | Return an order status (`placed`, `preparing`, `shipped`, `delivered`) so the timeline shows the real step. This matters most if the page is reused for order tracking. |
| O2 | Totals list shows **"Shipping Charge: Free"** | [ThankYouSection.tsx:438](../src/app/ordersuccesfull/ThankYouSection.tsx#L438) | 🔴 | Same as C1: use the order's shipping amount. |

---

## 7. Designed but not built (waiting for an API)

These are in the approved mockups but were left out of the live pages because no API supports them.

| Feature | Page | Mockup | API needed |
|---|---|---|---|
| Choice of shipping method (standard / express, with prices) | Checkout | [design-mockups/cart](../design-mockups/cart/index.html) | `GET /shipping-methods?country=…` and a `shipping_method_id` on the order |
| Import duties / taxes line for international orders | Checkout | cart mockup | Duties amount in the order total response |
| Gift note and gift wrapping | Bag / Checkout | cart mockup | `gift_message`, `gift_wrap` fields on the order |
| Add-on switches (engraving / warranty / appraisal) directly in the bag | Bag | cart mockup | Update cart item add-ons, e.g. `PATCH /cart/:id { is_appraisal, warranty_year, engraving }` |
| List of available coupons to pick from | Bag | cart mockup | `GET /coupons/available` |
| Welcome code on the Welcome screen | Sign up | auth mockup | See A1 |
| Newsletter opt-in | Sign up | auth mockup | See A7 |
| "Keep me signed in" | Sign in | auth mockup | See A8 |
| Account email on the reset page; sign in after reset; sign out other devices | Reset password | auth mockup | See A6 |

---

## 8. Open questions for backend

1. What exactly does `POST /user/forgot-password` return for an **expired** and for an **already used** reset token? (A5)
2. What does the **bot verification** on the auth endpoints need from the frontend? (A10)
3. Is shipping really **free for every order and country**? If not, where should the frontend get the amount? (C1, O2)
4. Does `POST /user/signup` already accept `is_subscribed`? If yes, the newsletter checkbox can be added straight away. (A7)
5. Can order details include a **status** field for the confirmation timeline? (O1)
