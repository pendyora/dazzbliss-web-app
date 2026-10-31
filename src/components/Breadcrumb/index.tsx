'use client';

import React, { Suspense, useMemo } from 'react';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

import { useAppSelector } from '@/store';
import { carryForwardFilterCrumb } from '@/utils/breadcrumbFilterParams';

type Crumb = { label: string; href?: string; truncate?: boolean };

// Long filter combos (e.g. "YELLOW GOLD & HEART/OVAL/ROUND") shouldn't push the rest
// of the breadcrumb off-screen — clip past this width and fade the tail out instead
// of hard-cutting it.
const TRUNCATE_CLASSES =
  'inline-block max-w-[220px] sm:max-w-[130px] overflow-hidden whitespace-nowrap align-bottom [mask-image:linear-gradient(to_right,black_70%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_right,black_70%,transparent_100%)]';

// Routes where the breadcrumb should not render at all.
const HIDDEN_PATHS = new Set(['/', '/login', '/createanaccount']);

// Routing-only segments that should never appear as a visible crumb.
const SKIP_SEGMENTS = new Set(['premade']);

// Friendly labels for segments that don't read well when simply uppercased.
// Anything not listed falls back to the slug, uppercased (e.g. "engagement-rings"
// -> "ENGAGEMENT-RINGS"), matching the existing design.
const LABEL_MAP: Record<string, string> = {
  createanaccount: 'CREATE ACCOUNT',
  contactpage: 'CONTACT',
  faqs: 'FAQS',
  ordersuccesfull: 'ORDER SUCCESSFUL',
};

const toLabel = (segment: string) => {
  const decoded = decodeURIComponent(segment);
  return LABEL_MAP[decoded] ?? decoded.toUpperCase();
};

const BreadcrumbContent = () => {
  const pathname = usePathname() || '/';
  const searchParams = useSearchParams();
  const filterLabel = searchParams.get('filterLabel');
  const filterHref = searchParams.get('filterHref');
  // Diamond filters applied while browsing the custom-jewelry diamond step (e.g. "ROUND & D-F
  // COLOR"), carried over the same way — see CustomJewelryDiamondListTable's click handlers.
  const diamondFilterLabel = searchParams.get('diamondFilterLabel');
  const diamondFilterHref = searchParams.get('diamondFilterHref');
  const productTitle = useAppSelector((state) => state?.products?.selectedProduct?.product_details?.title);

  // Custom-jewelry builder (`/custom-jewelry?type=...&state=s|d|c&id=...&did=...`) never changes
  // path — only these query params and the two stores below move it through its steps.
  const flowType = searchParams.get('type');
  const flowStep = searchParams.get('state'); // 's' (setting) | 'd' (diamond) | 'c' (complete)
  const settingId = searchParams.get('id');
  const diamondId = searchParams.get('did');
  const selectedSettingStore = useAppSelector((state) => state?.customProduct?.selectedSettingStore);
  const selectedDiamondStore = useAppSelector((state) => state?.customProduct?.selectedDiamondStore);
  const settingTitle = selectedSettingStore?.product_details?.title;
  const diamondTitle =
    selectedDiamondStore?.fullTitle ??
    (selectedDiamondStore?.shape_code && selectedDiamondStore?.carats
      ? `${selectedDiamondStore.carats} CT ${selectedDiamondStore.shape_code}`
      : undefined);

  const crumbs = useMemo<Crumb[]>(() => {
    const segments = pathname.split('/').filter(Boolean);
    const items: Crumb[] = [{ label: 'HOME', href: '/' }];

    let acc = '';
    segments.forEach((segment) => {
      acc += `/${segment}`;
      if (SKIP_SEGMENTS.has(segment)) {
        return;
      }
      items.push({ label: toLabel(segment), href: acc });
    });

    // Filters applied on the PLP the shopper navigated from (e.g. "10K & ROUND"),
    // carried over as query params — see ProductProfile's click handler.
    if (filterLabel && filterHref) {
      items.push({ label: filterLabel.toUpperCase(), href: filterHref, truncate: true });
    }

    // PDP URLs end in `/premade` (skipped above), so append the product name as
    // the final crumb once it's available in the store.
    if (segments.includes('premade') && productTitle) {
      items.push({ label: String(productTitle).toUpperCase() });
    } else if (segments.length === 1 && segments[0] === 'custom-jewelry') {
      // Fixed setting-then-diamond order regardless of which the shopper actually picked
      // first (type=1 lets them start with a diamond) — a stable trail reads better than one
      // that reorders itself depending on pick order.
      //
      // Every href below is assembled from scratch out of `type`/`state`/`id`/`did`, so without
      // carryForwardFilterCrumb a crumb click would strip the filter crumbs out of the URL —
      // i.e. clicking the breadcrumb would delete the breadcrumb.
      if (settingTitle) {
        items.push({
          label: String(settingTitle).toUpperCase(),
          // Keeps `did`: stepping back to the setting must not throw away a diamond the shopper
          // has already picked — the stepper's own "CHANGE" links behave the same way.
          href: settingId
            ? carryForwardFilterCrumb(`/custom-jewelry?type=${flowType}&state=s&id=${settingId}${diamondId ? `&did=${diamondId}` : ''}`, searchParams)
            : undefined,
        });
      }
      if (flowStep === 'd' || flowStep === 'c') {
        // Diamond filters used to reach the picked diamond — same crumb pattern as the PLP
        // metal/shape crumb, one level up. Gated on a diamond actually being picked: with no
        // `did` the shopper is still ON the filtered list, so this crumb would either point at
        // the current page or, worse, show the filters from a previous visit to it.
        if (diamondId && diamondFilterLabel && diamondFilterHref) {
          items.push({ label: diamondFilterLabel.toUpperCase(), href: diamondFilterHref, truncate: true });
        }
        items.push({
          // Only name the diamond once one is actually picked (`did`). `selectedDiamondStore`
          // outlives the selection — stepping back to the list leaves the previous diamond in
          // the store, and the crumb would label the list page with it.
          label: diamondId && diamondTitle ? String(diamondTitle).toUpperCase() : 'DIAMOND',
          href:
            flowStep === 'c' && diamondId
              ? carryForwardFilterCrumb(
                  `/custom-jewelry?type=${flowType}&state=d&did=${diamondId}${settingId ? `&id=${settingId}` : ''}`,
                  searchParams,
                )
              : undefined,
        });
      }
      if (flowStep === 'c') {
        items.push({ label: 'COMPLETE' });
      }
    }

    // The last crumb represents the current page — never link it.
    if (items.length > 1) {
      items[items.length - 1] = { ...items[items.length - 1], href: undefined };
    }

    return items;
  }, [
    pathname,
    productTitle,
    filterLabel,
    filterHref,
    flowType,
    flowStep,
    settingId,
    diamondId,
    settingTitle,
    diamondTitle,
    diamondFilterLabel,
    diamondFilterHref,
    searchParams,
  ]);

  if (HIDDEN_PATHS.has(pathname) || crumbs.length <= 1) {
    return null;
  }

  return (
    <nav aria-label="breadcrumb" className="container-xs 2xl:px-[50px] xl:px-[50px] lg:px-[30px] md:px-5 sm:px-3">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 py-4 sm:py-3 text-[13px] sm:text-[11px] font-medium tracking-[0.6px]">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={`${crumb.label}-${index}`} className="flex items-center gap-x-2">
              {crumb.href && !isLast ? (
                <Link
                  href={crumb.href}
                  title={crumb.truncate ? crumb.label : undefined}
                  className={`uppercase text-[#8a8a8a] transition-colors hover:text-[#18381d] ${crumb.truncate ? TRUNCATE_CLASSES : ''}`}
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  title={crumb.truncate ? crumb.label : undefined}
                  className={`uppercase text-[#3f3f3f] ${crumb.truncate ? TRUNCATE_CLASSES : ''}`}
                >
                  {crumb.label}
                </span>
              )}
              {!isLast && (
                <span className="select-none text-[#c2c2c2]" aria-hidden="true">
                  &gt;
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

/**
 * Global breadcrumb rendered once (under the Header in AppProvider) so it shows
 * on every page. Crumbs are derived from the URL path. On a PDP
 * (`/[jewelryType]/premade?slug=...`) the routing-only `premade` segment is
 * dropped and the final crumb shows the product name from the store instead of
 * the slug — e.g. HOME > ENGAGEMENT-RINGS > FOREVER VALENTINE SOLITAIRE...
 *
 * The custom-jewelry builder (`/custom-jewelry`) never changes path — it's a single route
 * driven by `type`/`state`/`id`/`did` query params plus the `customProduct` store — so it
 * gets the same step-aware treatment: HOME > CUSTOM-JEWELRY > <SETTING> > <DIAMOND> > COMPLETE,
 * each crumb appearing only once its step has data.
 *
 * Wrapped in Suspense because BreadcrumbContent uses useSearchParams(), which
 * Next.js requires for every page rendering it (this is mounted globally) —
 * without the boundary every page in the app is forced out of static prerendering.
 */
const Breadcrumb = () => (
  <Suspense fallback={null}>
    <BreadcrumbContent />
  </Suspense>
);

export default Breadcrumb;
