# Account, wishlist, search & appointment: placeholder content and API changes

**Scope:** `/profile` (Overview, Addresses, Details), `/profile/purchases` (Orders + `?order=` detail), `/wishlist`, `/search` and
`/virtual-appointment`, built from [design-mockups/account](../design-mockups/account/index.html),
[search](../design-mockups/search/index.html) and [appointment](../design-mockups/appointment/index.html).
**Last updated:** 14 Oct 2026

Priority: 🔴 before launch · 🟠 soon · ⚪ later

## Account & wishlist

All data comes from the existing APIs: user/auth slice (details, addresses), `/order/list` and `/order/:id`, the wishlist API (or local storage
for guests). Profile, password and address forms keep their existing API calls.

| # | What | Today | Needed | Priority |
|---|---|---|---|---|
| A1 | **Order totals breakdown** (pieces, warranty, shipping, tax) on the order detail | Only "Paid" (`after_gst_amount`) is shown, plus each line's price | Return `subtotal`, `shipping_amount`, `tax_amount`, `discount_amount` and the payment method on `/order/:id`. | 🟠 |
| A2 | **Delivery address and dates on an order** | Not shown: the order API doesn't send them | Add `delivery_address`, `estimated_delivery_date` and per-status dates to `/order/:id`. The tracker then shows real dates instead of "Done". | 🟠 |
| A3 | **Invoice download** (mockup) | Not built | `invoice_url` on the order. | ⚪ |
| A4 | **"Member since"** on the greeting band (mockup) | Shows the email instead | `created_at` on the user. | ⚪ |
| A5 | **Wishlist "Price dropped" / "Back in stock" labels, Share wishlist** (mockup) | Not built | Price-at-save and stock flags per wishlist item; a share link endpoint. | ⚪ |
| A6 | **Add to bag from the wishlist** (mockup) | Cards open the product page (size / options are needed first) | Same "default variant, no size needed" flag as listing-page quick add. | ⚪ |
| A7 | **Password rule** | The change-password form now asks for 8+ characters (it previously allowed 6 while saying 8), matching sign-up. | Confirm the backend accepts the same rule. | ⚪ |

## Search

Uses the existing `getJewelrySearch` API. Category tabs and counts are worked out from the returned results; sort (best match / price) is
done in the browser. When the API returns `isSuggested`, the page shows the "No pieces match" state with those suggestions underneath.

| # | What | Today | Needed | Priority |
|---|---|---|---|---|
| S1 | **Popular / "Try also" searches** | Hardcoded list (`POPULAR_SEARCHES` in `components/Header/mega/headerContent.ts`, shared with the header) | `GET /search/popular`, or related searches per query. | 🟠 |
| S2 | **"Did you mean …?"** (mockup) | Not built | Spelling suggestion in the search response. | ⚪ |
| S3 | **Server-side sort and paging** | The page sorts what the API returns | `sort` and `page` parameters if results can exceed one page. | ⚪ |
| S4 | **Journal results in search** (mockup) | Not built | Include matching blog posts. | ⚪ |

## Virtual appointment

Same `POST /appointment` payload as before: `service` / `jewelry_type`, `date` (YYYY-MM-DD), `time` (e.g. "2:00 PM - 2:50 PM", New York
time), `name`, `email`, `phone_numbers`, `message`, `locations: 'Virtual Appointment'`. Services and images are still `JEWELRY_TYPE` in
`constants/master.constant.ts`.

| # | What | Today | Needed | Priority |
|---|---|---|---|---|
| V1 | **Real availability** | Slots are generated in the browser: hourly 9am–5pm New York time, every day for 14 days, past times hidden. Nothing is ever shown as taken. | `GET /appointment/slots?date=` returning taken or free slots. | 🔴 |
| V2 | **Video or phone** | Not in the API. A phone choice is added to the start of `message` as "[Prefers a phone call]". | Optional `call_type` field. | ⚪ |
| V3 | **Opening hours copy** | "We're available every day" (from the old page's "Daily"). The client-care pages say Mon–Fri. | Confirm the real appointment days. | 🟠 |
| V4 | **Add to calendar** (mockup) | Not built on the confirmation | An `.ics` link in the confirmation email or response. | ⚪ |
| V5 | **Appointment length** | 50 minutes, matching the existing slot times (the mockup said 30). | Confirm. | ⚪ |
