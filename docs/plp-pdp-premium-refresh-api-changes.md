# Listing & product page refresh: placeholder content and API changes

**Scope:** the Atlantic palette and the new listing page (PLP) and product page (PDP), built from
[design-mockups/plp-v3](../design-mockups/plp-v3/index.html) and [design-mockups/product-page-v4](../design-mockups/product-page-v4/index.html).
**Last updated:** 5 Oct 2026

Everything on these pages still comes from the existing APIs except the items below. Earlier items that still apply (PLP intro claims, "Free shipping and returns", shipping shown as complimentary) are tracked in [redesign-dummy-content-and-api-changes.md](redesign-dummy-content-and-api-changes.md).

Priority: 🔴 before launch · 🟠 soon · ⚪ later

## 1. Listing page (`/[jewelryType]`)

| # | What | Today | Where | Needed | Priority |
|---|---|---|---|---|---|
| L1 | **Promo tiles** in the grid (card-size, every 8 products, alternating left/right edge) | Use `PromotionalImages` from the API. The old hardcoded fallback images (`/images/img_mask_group_21_1.png`) were **removed**, so with no CMS banners only the service tile shows. | [PlpGrid.tsx](../src/app/%5BjewelryType%5D/PlpGrid.tsx) | Marketing to upload PLP promo banners (portrait 4:5, ≥1200 px). Optional: per-banner `eyebrow` and `cta_label` (labels are fixed to "Featured" / "Shop now" today). | 🟠 |
| L2 | **Navy service tile**: "Book a jeweler · See it before you decide · Video appointment" | Hardcoded, links to `/virtual-appointment` | `PlpGrid.tsx` → `ServiceTile` | Fine as is. Could come from the CMS with the banners. | ⚪ |
| L3 | **"Not sure of the size?" card** under the filters | Hardcoded, links to `/virtual-appointment` | [index.tsx](../src/app/%5BjewelryType%5D/index.tsx) | Fine as is. Could become a "free ring sizer" link once that exists. | ⚪ |
| L4 | **Card badge** (top-left of the image) | Shows the first `special_product_titles` entry, else "Fast delivery" | `ProductProfile/index.tsx` | OK. If marketing wants "New" / "Bestseller" specifically, add a `badge` field per product. | ⚪ |
| L5 | **Quick add** on cards (in the mockup) | Not built: adding to bag needs size/options | — | Needs a "default variant + no size required" flag per product to allow one-tap add. | ⚪ |

## 2. Product page (`/[jewelryType]/premade`)

| # | What | Today | Where | Needed | Priority |
|---|---|---|---|---|---|
| D1 | **Promise band** (navy, page foot): Finest diamonds & gemstones · 90-day warranty · Expert support · Shop now, pay later | Hardcoded (carried over from the old trust list) | [PdpAssurance.tsx](../src/app/%5BjewelryType%5D/premade/pdp/PdpAssurance.tsx) | Marketing to confirm. "90-day warranty" must match the warranty plans the API returns. | 🔴 |
| D2 | **Atelier band**: "Made by hand, made to last", four making stages, model photo | Hardcoded copy; photo is `/images/Model/marcin-sajur-…jpg` | [PdpAtelier.tsx](../src/app/%5BjewelryType%5D/premade/pdp/PdpAtelier.tsx) | Static brand copy. Confirm the photo is licensed for commercial use (Unsplash). | 🟠 |
| D3 | **"Pairs beautifully with"** section | Uses the existing *suggestions* API (similar products), not real pairings | [PdpSuggestions.tsx](../src/app/%5BjewelryType%5D/premade/pdp/PdpSuggestions.tsx) | `GET /products/:id/pairs-with` (e.g. matching band for a ring, studs for a pendant). Until then the heading promises more than the data. | 🟠 |
| D4 | **Care accordion** text | Hardcoded short care line + link to `/jewelry-care` | [PdpDetails.tsx](../src/app/%5BjewelryType%5D/premade/pdp/PdpDetails.tsx) | Optional per-product `care_instructions`. | ⚪ |
| D5 | **Carat buttons with a price on each** (mockup) | Carat options show the carat only | `PDPPage.tsx` (carat `ChoiceChip`) | Return the price per option in the variant list so each button can show it. | ⚪ |
| D6 | **Gallery badge** on the first image ("Bestseller") | Supported by `PdpGallery` (`badge` prop) but not passed: no product field | `PdpGallery.tsx` | Same `badge` field as L4. | ⚪ |
| D7 | **Delivery countdown** ("Order within 4h 12m…", mockup) | Not built. The page shows the API's estimated delivery date. | — | Order cut-off time per warehouse in the delivery estimate API. | ⚪ |
| D8 | **Certificate link** (IGI/GIA report, mockup) | Not built | — | `certificate_url` and `lab` on the SKU / diamond. | 🟠 |
| D9 | **Reviews summary** (score, star bars, photo reviews) | Comes from the Yotpo widget as configured in Yotpo | `PdpReviews.tsx` | Configure the Yotpo widget to show the summary and photos. | ⚪ |

## 3. Palette

The Atlantic palette lives in [src/styles/theme-colors.js](../src/styles/theme-colors.js). Old token names were kept (`paper`, `stone`, `ink`, `line`, `gilt` = teal accent, `noir` = navy surfaces), so **every page changed colour**, including old pages not yet redesigned (homepage, profile, etc.). Those pages should get a visual check. Nothing here needs the API.
