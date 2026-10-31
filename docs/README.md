# Storefront design docs

These docs list the placeholder content in the redesigned Dazzbliss storefront and the **backend/API changes the new design needs**.
They were written while designing in a separate design repo (May–Oct 2026) and copied here when the design was merged into this repo
(branch `design-merge`). Every item was re-checked against the merged code and `latest-backend-main` on **31 Oct 2026**.

The design mockups are not in this repo. They live in the design repo (working name `pendyora-web-app`), branch `shruti/mockups`, folder
`design-mockups/`. The other docs refer to mockups by their path in that folder.

## Docs

| Doc                                                                                    | Covers                                                                                                                                                 |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [redesign-dummy-content-and-api-changes.md](redesign-dummy-content-and-api-changes.md) | Main list: sign-in / sign-up / password screens, PLP, PDP, bag, checkout, order confirmation, designed-but-not-built features, open backend questions. |
| [plp-pdp-premium-refresh-api-changes.md](plp-pdp-premium-refresh-api-changes.md)       | Second pass on the listing and product pages (promo tiles, badges, certificate, pairings) and the Atlantic palette.                                    |
| [header-mega-menu-api-changes.md](header-mega-menu-api-changes.md)                     | Header: announcement bar, mega menu, search panel, mobile drawer (`/mega-menu`, `/promotional-strips`).                                                |
| [account-search-appointment-api-changes.md](account-search-appointment-api-changes.md) | Account and order detail, wishlist, search page, virtual appointment.                                                                                  |
| [blog-collections-api-changes.md](blog-collections-api-changes.md)                     | Journal (blog) and collections pages.                                                                                                                  |
| [info-pages-api-changes.md](info-pages-api-changes.md)                                 | Client-care pages: terms, privacy, shipping & returns, FAQs, contact.                                                                                  |

## How to use the Status column

Every item has a **Status**:

| Status                           | Meaning                                                                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `Done (in latest code)`          | Built, or fine as is. Nothing to do.                                                                                           |
| `Partly done — <what's missing>` | Some of it is in the code; the note says what is left.                                                                         |
| `Still needed`                   | Not started. "(content)" means a business or marketing action, not code. "(frontend only)" means the API already has the data. |
| `No longer applies — <why>`      | The newer code made it unnecessary.                                                                                            |
| `Check`                          | Could not be confirmed from code (live data, admin app, business decision).                                                    |

When an item is finished, change its Status to `Done (in latest code)` in the doc. If it needed a backend change, also mark it
Done in [`dazzbliss-backend-portal/docs/STOREFRONT_DESIGN_API_REQUESTS.md`](../../dazzbliss-backend-portal/docs/STOREFRONT_DESIGN_API_REQUESTS.md).
Keep the priority labels: 🔴 before launch · 🟠 soon · ⚪ later.

## Backend work still needed

Every `Still needed` or `Partly done` item that needs a backend/API change. Item numbers repeat across docs, so read them with the doc.
New fields must use snake_case names (Nest port).

| #   | Doc              | Item                                      | Endpoint / field needed                                                                                             | Priority |
| --- | ---------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------- |
| 1   | redesign         | C1, O2 Shipping charge                    | Compute shipping in cart/order pricing, save `Orders.delivery_cost`, return it in cart totals and `/order/:id`      | 🔴       |
| 2   | redesign         | D1 Free shipping and returns              | Optional `shipping_policy` in project settings                                                                      | 🔴       |
| 3   | redesign         | A1 Welcome code                           | `POST /user/signup`: create and email a single-use coupon, return `welcome_coupon`                                  | 🔴       |
| 4   | account          | V1 Real appointment availability          | `GET /appointment/slots?date=`; `POST /appointment` rejects booked slots                                            | 🔴       |
| 5   | header           | M2 Small menu icons                       | Backfill script for old icons (new uploads are resized); SVG support if wanted                                      | 🔴       |
| 6   | redesign         | A5 Expired / used reset link              | Reset token time limit; `POST /user/forgot-password` returns `410` + `code: RESET_TOKEN_EXPIRED / RESET_TOKEN_USED` | 🟠       |
| 7   | redesign         | A7 Newsletter opt-in                      | `is_subscribed` on `POST /user/signup`; only subscribe in Klaviyo when true                                         | 🟠       |
| 8   | redesign         | A3 Auth posters from CMS                  | `GET /auth-campaigns`                                                                                               | 🟠       |
| 9   | account          | A1 Order totals breakdown                 | `subtotal`, `shipping_amount`, `tax_amount`, `discount_amount` on `/order/:id`                                      | 🟠       |
| 10  | account          | A2 Delivery address and dates             | City/state/country names in `deliveryAddressDetails` on `/order/:id`; per-step dates (confirmed, manufacturing)     | 🟠       |
| 11  | account, header  | S1 Popular searches                       | `GET /search/popular` → `[{ term }]`                                                                                | 🟠       |
| 12  | blog-collections | L2, L3 Collection filters and "New" label | `style`, `is_new` on Collection, returned by the header API `collections`                                           | 🟠       |
| 13  | header           | M3 Service strip per menu                 | `service_strip` (JSONB) on `MegaMenu`                                                                               | 🟠       |
| 14  | info-pages       | A1 FAQ topics                             | `category` per FAQ item in `/cms/type/2` content (admin editor)                                                     | 🟠       |
| 15  | plp-pdp          | L1 Promo tile labels                      | `eyebrow`, `cta_label` on `PromotionalImages`                                                                       | 🟠       |
| 16  | plp-pdp          | D3 Pairs beautifully with                 | `GET /products/:id/pairs-with` + pairing data                                                                       | 🟠       |
| 17  | plp-pdp          | D8 Certificate link (premade)             | `certificate_url`, `report_no` on `SkuMasters`, in the PDP response                                                 | 🟠       |
| 18  | redesign         | A6 Reset page extras                      | `GET /user/reset-token?token=`; session payload from reset; sign out other sessions on reset                        | ⚪       |
| 19  | redesign         | D4 Engraving fonts                        | `fonts[]` in the engraving project setting                                                                          | ⚪       |
| 20  | redesign         | D5 Recently viewed                        | `GET/POST /user/recently-viewed`                                                                                    | ⚪       |
| 21  | account          | A4 Member since                           | `created_at` in login and `GET /user`                                                                               | ⚪       |
| 22  | account          | A5 Wishlist labels, share                 | Price at save, stock flags in `GET /wishlist`; share endpoint                                                       | ⚪       |
| 23  | account, plp-pdp | A6, L5 Quick add                          | Default SKU + "no size needed" flag per product (list, wishlist)                                                    | ⚪       |
| 24  | account          | A7 Password rule                          | Minimum 8 on `PUT /user/password`, `POST /user/signup`, reset                                                       | ⚪       |
| 25  | account          | S2 Did you mean                           | Spelling suggestion in `GET /jewelry/search`                                                                        | ⚪       |
| 26  | account          | V2 Video or phone                         | `call_type` on `POST /appointment`                                                                                  | ⚪       |
| 27  | account          | V4 Add to calendar                        | `.ics` in the confirmation email or response                                                                        | ⚪       |
| 28  | blog-collections | B1 Read time                              | Computed `read_minutes` on `/blog/all` and `/blog/featured-views`                                                   | ⚪       |
| 29  | blog-collections | L4 Wide collection tiles                  | `is_featured` on Collection                                                                                         | ⚪       |
| 30  | header           | M4 Tile subtitle                          | `menu_images[].cta_label` (admin field, JSONB)                                                                      | ⚪       |
| 31  | header           | M5 Link badge                             | `sub_menu[].tag` (admin field, JSONB)                                                                               | ⚪       |
| 32  | header           | M6 Highlighted item                       | `is_highlighted` on `MegaMenu`                                                                                      | ⚪       |
| 33  | header           | M9 Master items                           | `title`, `image` on each `master[]` entry in `/mega-menu`                                                           | ⚪       |
| 34  | header           | P3 Strip right-side links                 | `data.links` on the promotional strip (admin field)                                                                 | ⚪       |
| 35  | info-pages       | A2 Contact topic                          | `topic`, `order_number` on `POST /contact-us`                                                                       | ⚪       |
| 36  | info-pages       | A3 Policy pages from CMS                  | New CMS types for terms / privacy / shipping, with `updated_at`                                                     | ⚪       |
| 37  | plp-pdp          | L4, D6 Product badge                      | `badge` on `Jewelry`                                                                                                | ⚪       |
| 38  | plp-pdp          | D4 Care instructions                      | `care_instructions` on `Jewelry`                                                                                    | ⚪       |
| 39  | plp-pdp          | D5 Price on carat buttons                 | Price on each `sizes[]` option in the PDP variant data                                                              | ⚪       |
| 40  | plp-pdp          | D7 Delivery countdown                     | Order cut-off time in `handling_dates[]`                                                                            | ⚪       |
| 41  | redesign         | §7 Shipping method choice                 | `GET /shipping-methods?country=`, `shipping_method_id` on the order                                                 | —        |
| 42  | redesign         | §7 Import duties                          | Duties amount in the order totals                                                                                   | —        |
| 43  | redesign         | §7 Gift note and wrap                     | `gift_message`, `gift_wrap` on the order                                                                            | —        |
| 44  | redesign         | §7 Add-on switches in bag                 | `is_appraisal`, warranty on `PUT /cart/update-cart-item`                                                            | —        |
| 45  | redesign         | §7 Available coupons                      | `GET /coupons/available`; review the open `GET /coupons` route                                                      | —        |

Not in this table because they need only data or an admin action: mega-menu and strip links stored as paths (header M1, P1),
`is_active` on "Custom Engagement Ring" (header M8), PLP intro text in `Masters.description` (redesign P1).
