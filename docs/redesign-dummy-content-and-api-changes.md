# Redesign: placeholder content and required API changes

**Scope:** the Dazzbliss storefront redesign (first built on branch `shruti/plp` in `pendyora-web-app`, now merged here): product listing (PLP), product page (PDP), bag, checkout, order confirmation, and sign-in / sign-up / password screens.
**Mockups:** the design mockups live in the `pendyora-web-app` repo (branch `shruti/mockups`, folder `design-mockups/`), not in this repo.
**Last updated:** 31 Oct 2026 (statuses checked against this repo's `design-merge` branch and `latest-backend-main`)

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

### Status

`Done (in latest code)` · `Partly done — <what's missing>` · `Still needed` · `No longer applies — <why>` · `Check`.
Frontend paths are in this repo; backend paths are in `latest-backend-main/`.

---

## 1. Summary

| # | Page | Item | Type | Priority | Status |
|---|---|---|---|---|---|
| A1 | Sign up, Sign in | "10% off your first piece", welcome code sent by email | Placeholder offer | 🔴 | Still needed |
| A2 | Sign up | Welcome perks (free gift wrapping, birthday surprise, early access, free lifetime cleaning) | Placeholder claims | 🔴 | Still needed (content) |
| A3 | All auth screens | Poster campaigns (images, headlines, copy, links) | Hardcoded content | 🟠 | Still needed |
| A4 | Sign in | "Members only" private preview, "early access to launches" | Placeholder claim | 🔴 | Still needed (content) |
| A5 | Reset password | Detecting an expired or used reset link | API assumption | 🟠 | Partly done — used links are caught (401); no stable code, links never expire |
| A6 | Reset password | Showing the account email; signing in after the reset | Needs API | ⚪ | Still needed |
| A7 | Sign up | Newsletter opt-in | Needs API (not built) | 🟠 | Still needed — and every sign-up is already subscribed in Klaviyo |
| A8 | Sign in | "Keep me signed in" | Needs API (not built) | ⚪ | Check — sessions already last ~80 days |
| A9 | Sign up | Text-message consent checkbox is required | Legal check | 🟠 | Still needed (legal) |
| A10 | All auth screens | "Bot verification failed" from the API | API question | 🟠 | Done (in latest code) — Turnstile |
| P1 | PLP | Intro text per category ("recycled gold", "lab-grown and ethically mined diamonds") | Hardcoded claims | 🔴 | Partly done — `Masters.description` exists; frontend still hardcoded |
| P2 | PLP | "Fast delivery" badge threshold (`handling_days <= 2`) | Hardcoded rule | ⚪ | Still needed |
| D1 | PDP | "Free shipping and returns" | Hardcoded claim | 🔴 | Partly done — removed from the tab, still under the delivery estimate |
| D2 | PDP | Trust list (finest diamonds, 90-day warranty, expert support, pay later) | Hardcoded claims | 🟠 | Still needed (content) |
| D3 | PDP | Atelier band (four making stages, image) | Static brand copy | ⚪ | Partly done — heading changed; stages and photo still hardcoded |
| D4 | PDP | Engraving font list | Hardcoded list | ⚪ | Still needed |
| D5 | PDP | "Recently viewed" saved in the browser only | Local only | ⚪ | Still needed |
| C1 | Bag, Checkout | Shipping shown as "Complimentary"; no shipping cost from the API | Hardcoded value | 🔴 | Still needed |
| C2 | Bag | Trust list (certified diamonds, worldwide shipping, 30-day returns) | Hardcoded claims | 🔴 | Still needed (content) |
| C3 | Bag | Payment logos (Visa, Mastercard, Amex, Discover, PayPal, Affirm) | Hardcoded list | 🟠 | Still needed — Shop Pay and Google Pay missing from the list |
| O1 | Order confirmation | Progress timeline always shows "Being prepared" | Hardcoded status | 🟠 | Partly done — API sends `order_status`; page still hardcoded |
| O2 | Order confirmation | "Shipping Charge: Free" | Hardcoded value | 🔴 | Still needed |

---

## 2. Sign in, sign up and password screens

Routes: `/login`, `/createanaccount`, `/forgotpassword`, `/forgot-password?token=…`
Design reference: [auth mockup](https://github.com/pendyora/pendyora-web-app/blob/shruti/mockups/design-mockups/auth/index.html)

Every screen is split in two: a **campaign poster** and the form. All poster content is in one file, [src/components/Auth/authPosters.tsx](../src/components/Auth/authPosters.tsx), so it can be changed without touching the pages. Poster images are in `public/images/auth/`.

Brand note: the poster tags in `authPosters.tsx` are literally `'Pendyora · Autumn 2026'`, `'Pendyora · Welcome'`, `'Pendyora · Members'`, `'Pendyora · Care'`, `'Pendyora · Appointments'`, and the forms say "New to Pendyora?" (`LoginGroup2722.tsx`) and "Join Pendyora" (`CreateanaccountGroup2691.tsx`) (to change in brand cleanup).

### Placeholder content, by screen

| Screen | What is placeholder | Where | Priority | Status |
|---|---|---|---|---|
| **Sign in** (`/login`) | Poster carousel with 3 slides: "The Golden Hour edit" (links to `/collections`), "Say yes, beautifully" bridal (links to `/virtual-appointment`), "The Private Preview, Members only" (links to `/createanaccount`). The `'Pendyora · Autumn 2026'` tag. | [authPosters.tsx:84](../src/components/Auth/authPosters.tsx#L84) | 🟠 / 🔴 for "Members only" | Still needed (content) |
| **Sign in** | "Create an account and get 10% off your first piece." under "Join the house" (text comes from the sign-up offer below) | [LoginGroup2722.tsx:157](../src/app/login/LoginGroup2722.tsx#L157) | 🔴 | Still needed (content) |
| **Sign in** | Benefit list: Faster checkout, Order history & tracking, Wishlist on every device, **Early access to launches** | [LoginGroup2722.tsx:22](../src/app/login/LoginGroup2722.tsx#L22) (`BENEFITS`) | 🔴 for early access | Still needed (content) |
| **Create account** (`/createanaccount`) | Offer card: **"10% off your first piece. Join today and we'll email your welcome code. Valid for 30 days on full-price jewelry."** | [authPosters.tsx:121](../src/components/Auth/authPosters.tsx#L121) | 🔴 | Still needed — no welcome code exists (A1) |
| **Create account** | Perks: **Free gift wrapping, Birthday surprise, Early access to launches, Free lifetime cleaning** | [authPosters.tsx:131](../src/components/Auth/authPosters.tsx#L131) | 🔴 | Still needed (content) — no such features in the backend (free gifts are an order-value offer, not a sign-up perk) |
| **Create account** | Form intro: "Your welcome code arrives by email." | [CreateanaccountGroup2691.tsx:172](../src/app/createanaccount/CreateanaccountGroup2691.tsx#L172) | 🔴 | Still needed (content) |
| **Welcome** (after sign-up) | Poster: "You're on the list. The Private Preview…" | [authPosters.tsx:144](../src/components/Auth/authPosters.tsx#L144) | 🔴 | Still needed (content) |
| **Forgot password** (`/forgotpassword`) and **Check your inbox** | Still-life poster: "Gifts that are kept. Hand-picked pieces **under $500**, wrapped in our signature box **at no cost**." (links to `/giftguide`) | [authPosters.tsx:78](../src/components/Auth/authPosters.tsx#L78) | 🟠 | Still needed (content) |
| **Set a new password** (`/forgot-password?token=…`) | Poster: "Made to last a lifetime. Every piece comes with **free cleaning, polishing and a stone check**, for as long as you own it." Mobile strip: "Free lifetime cleaning for members." | [authPosters.tsx:176](../src/components/Auth/authPosters.tsx#L176) | 🔴 | Still needed (content) |
| **Password updated** | Reuses the "Golden Hour edit" poster | [authPosters.tsx:201](../src/components/Auth/authPosters.tsx#L201) | 🟠 | Still needed (content) |
| **Link expired** | Poster: "A private appointment… Always free." | [authPosters.tsx:207](../src/components/Auth/authPosters.tsx#L207) | 🟠 | Still needed (content) |

**What to do for each 🔴 item:** either confirm the business offers it (and set up the code or email), or change the copy in `authPosters.tsx`. The sign-in line under "Join the house" updates automatically from the offer card.

### API changes for auth

| # | Need | Current state | Proposed change | Status |
|---|---|---|---|---|
| A1 | **Welcome offer code** | No code is created or emailed on sign-up. The Welcome screen shows no code. | On successful `POST /user/signup`, create a single-use coupon and email it. Optionally return it so the Welcome screen can show it: `{ data: { …user, welcome_coupon: { code: "WELCOME10", percent: 10, expires_at: "2026-11-03" } } }` | Still needed — `_signup` (`src/controllers/users/registration.controller.ts`) creates no coupon; the welcome mail (`src/helpers/Mails/userWelcomeMail.ts`) has none. The newsletter coupon mail (`POST /user/subscribe-mail`) could be reused. |
| A3 | **Campaign content from the CMS** | Hardcoded in `authPosters.tsx` | New endpoint, e.g. `GET /auth-campaigns`, returning per screen (`signin`, `register`, `welcome`, `forgot`, `sent`, `reset`, `updated`, `expired`): `{ kind: "image" \| "offer" \| "still", slides: [{ desktop_image, mobile_image, eyebrow, title, title_accent, body, cta_label, cta_url }], offer?: { value, unit, caption, body, perks[] } }` | Still needed |
| A5 | **Clear error for an expired or used reset link** | The frontend *guesses* (`isExpiredLinkError` in [NewPassword.tsx:20](../src/app/forgot-password/NewPassword.tsx#L20)): HTTP 401/403/410, or a message containing "expire", "invalid" or "token", shows the "Link expired" screen. | Have `POST /user/forgot-password` return a stable code, e.g. `{ status: 410, code: "RESET_TOKEN_EXPIRED" }` or `"RESET_TOKEN_USED"`. | Partly done — a used or unknown token returns 401 "Invalid authentication Please login.", which the guess catches. Still missing: a stable `code`, and any time limit (the token's `createdAt` is never checked, so links never expire). Side effect: the 401 also triggers the global sign-out in `src/services/BaseService.ts`. |
| A6 | **Account email on the reset page** (in the mockup) | Not shown: the token alone doesn't tell the frontend whose account it is. | Optional `GET /user/reset-token?token=…` → `{ email: "s•••••@gmail.com", valid: true }`. This would also let the page show "Link expired" *before* the person types a new password. | Still needed |
| A6 | **Sign in automatically after the reset** (in the mockup) | The "Password updated" screen asks people to sign in again. | Optionally return the same session payload as `/user/login` from `POST /user/forgot-password`. | Still needed — `resetPassword` returns only "Update successfully". |
| A6 | **Sign out other devices after a reset** (in the mockup) | Copy removed, not supported. | Invalidate other sessions when the password changes, then we can put the copy back. | Still needed — `resetPassword` doesn't touch `UserLoginDetails`. |
| A7 | **Newsletter opt-in on sign-up** (in the mockup) | Checkbox left out. | Accept `is_subscribed: boolean` on `POST /user/signup`. Login already returns `is_subscribed`. | Still needed — not accepted. Note: `_signup` already subscribes **every** new account to the Klaviyo list with marketing consent; the opt-in should control that. |
| A8 | **"Keep me signed in"** (in the mockup) | Left out. | Accept `remember_me: boolean` on `/user/login` and issue a longer-lived token when it is true. | Check — `remember_me` is ignored, but tokens have no expiry and sessions are only cleared after ~80 days (`clearOldTokens`), so every login is already "kept". Only needed if a shorter default session is wanted. |
| A10 | **"Bot verification failed"** | It is Cloudflare Turnstile. The frontend now sends `cloudflareTurnstileToken` on login, sign-up, forgot-password request and reset. | — | Done (in latest code) — `src/middleware/verifyCloudflareTurnstile.ts` on `/user/login`, `/signup`, `/forgot-password` and related routes; it blocks only when `CLOUDFLARE_TURNSTILE_ENFORCE=true`. |

**Legal check (A9):** the sign-up page keeps the existing **required** checkbox agreeing to automated text messages ([CreateanaccountGroup2691.tsx:255](../src/app/createanaccount/CreateanaccountGroup2691.tsx#L255)). The wording literally says "…text messages … from Pendyora" (to change in brand cleanup) and links to Terms and Privacy. It also says "Consent is not a condition of any purchase", yet the box is required. US texting rules usually say SMS consent must not be required to create an account. Please check with legal whether this box should be optional, with a separate required box for Terms and Privacy as in the mockup. **Status:** Still needed (legal).

---

## 3. Product listing page (PLP)

Route: `/[jewelryType]` (for example `/rings`, `/all`, `/new-arrivals`)

| # | What is placeholder | Where | Priority | Needed | Status |
|---|---|---|---|---|---|
| P1 | Intro paragraph beside each category title, hardcoded per category. Every one claims **"recycled gold"** and **"Set with lab-grown and ethically mined diamonds, certified at origin."** Collections use the API description first. | [index.tsx:43](../src/app/%5BjewelryType%5D/index.tsx#L43) (`LEDE`, used at line 1079) | 🔴 | Confirm the claims, or add `description` to the category / jewelry-type API so marketing can manage it. | Partly done — `Masters.description` (`src/models/master.model.ts`) already exists and the masters API returns it. Fill it per jewelry type and read it in the frontend; Check the field isn't used for something else. |
| P2 | "Fast delivery" badge: also shown when `handling_days <= 2`, besides the project setting `fastDeliveryDay` | [ProductProfile/index.tsx:744](../src/components/ProductProfile/index.tsx#L744) (duplicated at line 1016) | ⚪ | Use only the `fastDeliveryDay` setting, or add a `is_fast_delivery` flag per product. | Still needed — frontend decision; no backend change if the rule is just dropped. |

The editorial promo tiles in the grid, the filters, sorting and product badges ("special product titles") already come from the API.

---

## 4. Product page (PDP)

Route: `/[jewelryType]/premade/…`

| # | What is placeholder | Where | Priority | Needed | Status |
|---|---|---|---|---|---|
| D1 | **"Free shipping and returns."** under the delivery estimate. (The Shipping & returns tab now shows the delivery note and a link to the policy instead of "Shipping and returns are free.") | [PDPPage.tsx:2510](../src/app/%5BjewelryType%5D/premade/PDPPage.tsx#L2510), [PdpDetails.tsx:88](../src/app/%5BjewelryType%5D/premade/pdp/PdpDetails.tsx#L88) | 🔴 | Confirm the policy, or return shipping/returns terms from the project settings API (for example `shipping_policy: { free_shipping: true, free_returns: true, return_days: 30 }`). | Partly done — tab claim removed; the PDP line remains and conflicts with the returns page (free only over $100 in the US). |
| D2 | Trust list: **Finest diamonds & gemstones, 90-day warranty, Expert support from our jewelers, Shop now, pay later** | [PdpAssurance.tsx](../src/app/%5BjewelryType%5D/premade/pdp/PdpAssurance.tsx) | 🟠 | Confirm. The "90-day warranty" should match the warranty plans returned by the API. | Still needed (content) |
| D3 | Atelier band: heading now "Made by hand, made to last"; the four stages (Drawing, Casting, Setting, Finishing) and the model photo. The "fourteen pairs of hands" claim is still on the homepage ([Craftsmanship.tsx](../src/app/homepage/Craftsmanship.tsx)). | [PdpAtelier.tsx](../src/app/%5BjewelryType%5D/premade/pdp/PdpAtelier.tsx) | ⚪ | Static brand copy. Could come from the CMS later. | Partly done — the photo `/images/Model/marcin-sajur-…jpg` is missing from `public/` (broken image). |
| D4 | Engraving fonts: Arial, Times New Roman, Georgia, Courier New, Verdana, Roboto, Lobster (same list in 3 files) | [PdpEngraving.tsx:10](../src/app/%5BjewelryType%5D/premade/pdp/PdpEngraving.tsx#L10), also `premade/Components/Engraving.tsx`, `components/CartProductDetails/EditEngraving.tsx` | ⚪ | Confirm the workshop can engrave these. Could come from the engraving master API alongside `engraving_price`. | Still needed — the engraving project setting `data` only holds `engraving_price` (a `fonts[]` key needs no migration). |
| D5 | "Recently viewed" tab is stored in the browser (`localStorage` key `recentlyViewedProducts`, last 10). It doesn't follow the customer across devices. | [useRecentlyViewed.ts](../src/app/%5BjewelryType%5D/premade/pdp/useRecentlyViewed.ts) | ⚪ | Optional: `GET/POST /user/recently-viewed` for signed-in customers. | Still needed |

Price, options, the delivery estimate, warranty and appraisal plans, the engraving price, suggestions and reviews (Yotpo) already come from APIs.

---

## 5. Bag and checkout

Routes: `/cart`, `/checkout`

| # | What is placeholder | Where | Priority | Needed | Status |
|---|---|---|---|---|---|
| C1 | Order summary always shows **"Shipping: Complimentary"**. No shipping cost is calculated or charged. The bag and checkout page descriptions also say "worldwide shipping available". The returns page says shipping is free only over $100 in the US, with paid UPS options. | [OrderSummary/index.tsx:122](../src/components/OrderSummary/index.tsx#L122) | 🔴 | Confirm free shipping everywhere, or return a shipping amount in the cart / order total API (for example `shipping: { amount: 0, label: "Complimentary" }`) and show that. | Still needed — `Orders.delivery_cost` exists but is never set for web orders; `otherPrice.shipping_charges_domestic` / `_international` are read but never added to a total (`calculateOrderPricing`, `src/service/order-processing.service.ts`). |
| C2 | Trust list: **Certified diamonds** (lab-grown and ethically mined, certified at origin), **Secure payment**, **Worldwide shipping** (complimentary on every order), **30-day returns** | [cart.tsx:36](../src/app/cart/cart.tsx#L36) | 🔴 | Confirm the policies (30 days needs to match the returns page). | Still needed (content) — 30 days matches; "complimentary on every order" does not. |
| C3 | Payment logos: VISA, MASTERCARD, AMEX, DISCOVER, PAYPAL, AFFIRM · US | [cart.tsx:42](../src/app/cart/cart.tsx#L42) | 🟠 | Must match the payment methods actually enabled. Could come from the payment settings API. | Still needed — the bag now also has Shop Pay and PayPal express buttons, and checkout has Google Pay; the logo list leaves out Shop Pay and Google Pay. Methods are switched by `NEXT_PUBLIC_*` env vars; no payment-settings API. |

Coupons, totals, tax, engraving, appraisal, warranty and free-gift lines already come from APIs (`useOrderTotals`).

---

## 6. Order confirmation

Route: `/ordersuccesfull`

| # | What is placeholder | Where | Priority | Needed | Status |
|---|---|---|---|---|---|
| O1 | Order timeline: "Order placed" uses the real date and "Arrives" uses the shipping dates from the order, but the middle step **"Being prepared" is always shown as the current step** | [ThankYouSection.tsx:464](../src/app/ordersuccesfull/ThankYouSection.tsx#L464) | 🟠 | Return an order status (`placed`, `preparing`, `shipped`, `delivered`) so the timeline shows the real step. | Partly done — `/order/:id` already returns `order_status` (`ORDER_STATE` in `src/constant/order.ts`: 0 pending payment … 4 delivered, 5–8 cancelled/failed) and the account pages use it (`OrderTracker`). Frontend only. |
| O2 | Totals list shows **"Shipping Charge: Free"** | [ThankYouSection.tsx:654](../src/app/ordersuccesfull/ThankYouSection.tsx#L654) | 🔴 | Same as C1: use the order's shipping amount. | Still needed — same as C1 (set `delivery_cost`, then read it here). |

---

## 7. Designed but not built (waiting for an API)

These are in the approved mockups but were left out of the live pages because no API supports them. Mockup: [cart](https://github.com/pendyora/pendyora-web-app/blob/shruti/mockups/design-mockups/cart/index.html), [auth](https://github.com/pendyora/pendyora-web-app/blob/shruti/mockups/design-mockups/auth/index.html).

| Feature | Page | Mockup | API needed | Status |
|---|---|---|---|---|
| Choice of shipping method (standard / express, with prices) | Checkout | [cart](https://github.com/pendyora/pendyora-web-app/blob/shruti/mockups/design-mockups/cart/index.html) | `GET /shipping-methods?country=…` and a `shipping_method_id` on the order | Still needed |
| Import duties / taxes line for international orders | Checkout | cart mockup | Duties amount in the order total response | Still needed — only `otherPrice.usa_duty` exists (product pricing, mostly commented out). |
| Gift note and gift wrapping | Bag / Checkout | cart mockup | `gift_message`, `gift_wrap` fields on the order | Still needed |
| Add-on switches (engraving / warranty / appraisal) directly in the bag | Bag | cart mockup | Update cart item add-ons, e.g. `PATCH /cart/:id { is_appraisal, warranty_year, engraving }` | Partly done — `PUT /cart/update-cart-item` (`_updateCartItem`) takes ring size and engraving text, and the bag uses it; appraisal and warranty can't be changed. |
| List of available coupons to pick from | Bag | cart mockup | `GET /coupons/available` | Still needed — `GET /coupons/:id?` returns **all** coupons (incl. expired/inactive) without sign-in; needs a filtered customer list, and the open route needs a security check. |
| Welcome code on the Welcome screen | Sign up | auth mockup | See A1 | See A1 |
| Newsletter opt-in | Sign up | auth mockup | See A7 | See A7 |
| "Keep me signed in" | Sign in | auth mockup | See A8 | See A8 |
| Account email on the reset page; sign in after reset; sign out other devices | Reset password | auth mockup | See A6 | See A6 |

---

## 8. Open questions for backend

| # | Question | Answer from the code (31 Oct 2026) |
|---|---|---|
| 1 | What exactly does `POST /user/forgot-password` return for an **expired** and for an **already used** reset token? (A5) | Used or unknown token: 401 "Invalid authentication Please login.". Tokens never expire by time. No `code` field. |
| 2 | What does the **bot verification** on the auth endpoints need from the frontend? (A10) | A Cloudflare Turnstile token in `data.cloudflareTurnstileToken`. Now sent. Resolved. |
| 3 | Is shipping really **free for every order and country**? If not, where should the frontend get the amount? (C1, O2) | The code charges nothing anywhere; the returns page says free only over $100 in the US. Business decision, then the backend work in C1. |
| 4 | Does `POST /user/signup` already accept `is_subscribed`? (A7) | No. Every sign-up is already subscribed in Klaviyo. |
| 5 | Can order details include a **status** field for the confirmation timeline? (O1) | Yes: `order_status` is already returned by `/order/:id`. |
