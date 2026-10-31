# Header & mega menu: placeholder content and API changes

**Scope:** new site header (announcement bar, main bar, mega menu, search panel, mobile drawer).
**Design reference:** [design-mockups/header/index.html](../design-mockups/header/index.html)
**Code:** [src/components/Header/mega/](../src/components/Header/mega/)
**Last updated:** 4 Oct 2026

The header is built from the existing APIs: `/mega-menu` (menu, columns, links, icons, tiles) and `/promotional-strips` (announcement messages). Some parts of the mockup have no API data, so for now they are hardcoded in [headerContent.ts](../src/components/Header/mega/headerContent.ts) or filled with fixed text.

## 1. Placeholder content (hardcoded today)

| Item | Where it shows | Current value | File |
|---|---|---|---|
| Service strip | Bottom of every mega-menu panel | "Need help choosing?": Book a virtual appointment, Diamond education, Jewelry care | `headerContent.ts` → `SERVICE_STRIP` |
| Announcement bar links | Right side of the black top bar (desktop) | Book an appointment, Client care | `headerContent.ts` → `ANNOUNCEMENT_LINKS` |
| Popular searches | Search panel, before typing | Engagement rings, Tennis bracelet, Diamond studs, Gold hoops, Lab-grown, Wedding bands | `headerContent.ts` → `POPULAR_SEARCHES` |
| Tile caption | Under each image tile in a panel | Always "Shop now →" | `MegaPanel.tsx` |
| Tile title fallback | Tile with an empty title | Uses the menu name | `MegaPanel.tsx` |
| Metal swatches | Metal links | Picked from the link's `?metal=` code (yg, wg, rg, wp = silver, pt) instead of the CMS icon | `menuModel.ts` |

## 2. API changes requested

### `/mega-menu`

| # | Need | Today | Proposed change | Priority |
|---|---|---|---|---|
| M1 | **Relative links** | Every link is stored as `https://ashclair.com/...`. The frontend now rewrites these to site paths, but new links on another domain would break. | Store paths only (`/rings?metal=yg`), or the current site domain. | 🔴 High |
| M2 | **Small icons** | Menu icons are full JPG photos (~290 KB each) shown at 22 px. They load slowly and some look blank in the drawer. | Upload icons as SVG or small PNG (≤ 10 KB), on a transparent background. | 🔴 High |
| M3 | **Service strip per menu** | Same hardcoded strip on every panel. | Per menu item: `service_strip: { label, links: [{ icon, label, link }] }` | 🟠 Medium |
| M4 | **Tile subtitle** | Fixed "Shop now". | On `menu_images[]`: `cta_label` (e.g. "Start now", "Our story"). | ⚪ Low |
| M5 | **Link badge** | No way to mark a link as new. | On `sub_menu[]`: `tag` (e.g. "New"). | ⚪ Low |
| M6 | **Highlighted menu item** | The mockup shows "The Atelier" in gold. Not possible today. | On the menu item: `is_highlighted: boolean`. | ⚪ Low |
| M7 | **Collections panel** | The mockup's image-card panel for collections can't be built from the menu data. | Either a menu item `type: "collections"` that returns `collections: [{ name, image, link }]`, or reuse the existing collections API. | 🟠 Medium |
| M8 | **`is_active` vs `is_web_visible`** | "Custom Engagement Ring" has `is_web_visible: true` but `is_active: false`. The new header hides inactive items (the old one showed them). | Confirm which flag controls the menu. If it should show, set `is_active: true`. | 🟠 Confirm |
| M9 | **Master items** | `master[]` entries only have an `id` and a link. The name and image come from a separate master list loaded on every page. | Return `title` and `image` on each `master[]` entry like `sub_menu[]`. | ⚪ Low |

### Search

| # | Need | Today | Proposed change | Priority |
|---|---|---|---|---|
| S1 | **Popular searches** | Hardcoded list. | `GET /search/popular` → `[{ term }]`, managed in the admin or based on real searches. | 🟠 Medium |
| S2 | **Trending pieces** | Not shown: no API. The mockup shows 4 trending products before typing. | `GET /products/trending?limit=4` → same shape as search results. | ⚪ Low |

### `/promotional-strips`

| # | Need | Today | Proposed change | Priority |
|---|---|---|---|---|
| P1 | **Relative links** | Links are `https://ashclair.com/all`. | Same as M1. | 🔴 High |
| P2 | **Message content** | Live messages include "90 DAY WARRANTY \| HASSLE FREE RETURNS \| 0% Finance", "Free domestic shipping", "10% OFF Site-wide \| Use Code…". | Marketing to confirm these are current offers. | 🟠 Confirm |
| P3 | **Right-side links** | Hardcoded (Book an appointment, Client care). | Optional `links: [{ icon, label, link }]` on the strip. | ⚪ Low |

## 3. Not changed (still from the API)

Menu names and order (`sequence`), columns and groups, link labels and URLs, "View all" links, menu image tiles, and announcement messages with countdowns (`endDate`, `enableEndDate`, `prefixText`). Currency list, cart and wishlist counts, and live search results also still come from the API.
