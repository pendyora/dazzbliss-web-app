# Journal (blog) & collections: placeholder content and API changes

**Scope:** `/blog` and `/blog/all-blogs` (now one Journal page, [JournalPage.tsx](../src/components/Journal/JournalPage.tsx)) and
`/collections` ([collections/index.tsx](../src/app/collections/index.tsx)), built from
[design-mockups/blog](../design-mockups/blog/index.html) and [design-mockups/collections](../design-mockups/collections/index.html).
**Last updated:** 14 Oct 2026

Priority: 🔴 before launch · 🟠 soon · ⚪ later

## Journal (blog)

Everything comes from the existing blog APIs: lead story = first item of `/blog/featured-views` `slider_view`; topics = `/blog/filter-options`
(names from master data); grid = `/blog/all` with `category`, `search`, `page`, `size` (12 per page, "Load more" fetches the next page);
newsletter tile = `/user/subscribe` (same API as the offer pop-up).

| # | What | Today | Needed | Priority |
|---|---|---|---|---|
| B1 | **Read time** and **author** on cards (in the mockup) | Not shown; the list API has no body length or author | Add `read_minutes` and `author` to `/blog/all` rows and featured views. | ⚪ |
| B2 | **Images** | Cards use `thumbnail_image`; missing images show the generic placeholder | Upload a landscape thumbnail (4:3, ≥1200 px) for every post. | 🟠 |
| B3 | **Journal intro text** | Hardcoded: "Guides to diamonds and metals, how our pieces are made…" | Fine as is; could come from the CMS. | ⚪ |
| B4 | **Wide "Featured" card** | The 3rd post in the "All" view is shown wide (layout only) | Optional `is_featured` flag on a post to choose which one. | ⚪ |
| B5 | **Old page removed** | The previous `/blog` landing (category carousel, featured slider, grid) and the `/blog/all-blogs` sidebar list are replaced by the Journal. `/blog/banner/4` is no longer requested. | — | — |

## Collections

Data from the header API `collections`: `name`, `description`, `desktop_image`, `mobile_image` and `jewelryCollectionDetails` (used for the
piece count). Links go to `/all?collections=<name-slug>` as before.

| # | What | Today | Needed | Priority |
|---|---|---|---|---|
| L1 | **Collection images** | The only live collection ("Mothers Day Collection") has **no image**, so the tile shows its name in serif instead. | Upload a square packshot (`desktop_image`) on a plain light background for each collection; optional `mobile_image`. | 🔴 |
| L2 | **Filters (All / New / Bridal / Everyday / Statement)** in the mockup | Not built: no field to filter by | Add `style` (e.g. bridal / everyday / statement) and `is_new` per collection. | 🟠 |
| L3 | **"New" label** | Not shown | Same `is_new` field. | ⚪ |
| L4 | **Wide navy tiles** | Every 7th collection (1st, 8th, 15th…) is shown wide. With one collection the page is a single wide tile. | Optional `is_featured` flag to choose which collections go wide. | ⚪ |
