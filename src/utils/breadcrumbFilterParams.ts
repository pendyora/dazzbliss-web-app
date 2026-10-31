/**
 * The custom-jewelry builder (`/custom-jewelry?type=...&state=s|d|c&id=...&did=...`) is a
 * single route driven entirely by query params and ~30 independent `router.push`/`router.replace`
 * call sites across the stepper (ShowStepper, the PDP's "select this setting/diamond" buttons,
 * the diamond list, and both in-builder filter panels). None of them know about
 * `filterLabel`/`filterHref` (the PLP metal/shape filter crumb — see ProductProfile's click
 * handler) or `diamondFilterLabel`/`diamondFilterHref` (the diamond-filter crumb, set once a
 * diamond is picked from a filtered list — see CustomJewelryDiamondListTable), so every
 * transition silently drops whichever of these two crumbs is currently active. The premade PDP
 * has the same problem: each metal/carat/shape switch rebuilds the URL from the new slug.
 *
 * This carries the crumb params forward onto a new destination URL, unchanged, whenever they're
 * present on the current one.
 */

/** The PLP filter crumb ("10K & ROUND"), set when leaving a filtered category listing. */
export const PLP_FILTER_CRUMB_PARAMS = ['filterLabel', 'filterHref'] as const;

/** The in-builder diamond filter crumb ("ROUND & D-F COLOR"), set when a diamond is picked. */
export const DIAMOND_FILTER_CRUMB_PARAMS = ['diamondFilterLabel', 'diamondFilterHref'] as const;

type CrumbParamPair = readonly [string, string];

const ALL_CRUMB_PARAM_PAIRS: CrumbParamPair[] = [PLP_FILTER_CRUMB_PARAMS, DIAMOND_FILTER_CRUMB_PARAMS];

/**
 * @param url          destination URL being pushed/replaced (relative, may already have a query)
 * @param searchParams the params of the page navigating away
 * @param pairs        which crumbs to carry — defaults to both. Pass only
 *                     `[PLP_FILTER_CRUMB_PARAMS]` from the diamond filter panel, where the
 *                     diamond crumb describes a filter set that's being replaced.
 *
 * A crumb the destination URL already sets itself always wins: the caller has a fresher value
 * (e.g. the diamond list appending the filters the shopper just used), and appending a second
 * copy would leave a stale duplicate in the URL.
 */
export function carryForwardFilterCrumb(url: string, searchParams: URLSearchParams, pairs: CrumbParamPair[] = ALL_CRUMB_PARAM_PAIRS): string {
  const queryStart = url.indexOf('?');
  const existing = new URLSearchParams(queryStart === -1 ? '' : url.slice(queryStart + 1));

  const parts: string[] = [];
  pairs.forEach(([labelKey, hrefKey]) => {
    if (existing.has(labelKey) || existing.has(hrefKey)) {
      return;
    }
    const label = searchParams.get(labelKey);
    const href = searchParams.get(hrefKey);
    if (label && href) {
      parts.push(`${labelKey}=${encodeURIComponent(label)}`, `${hrefKey}=${encodeURIComponent(href)}`);
    }
  });

  if (!parts.length) {
    return url;
  }
  const separator = queryStart === -1 ? '?' : '&';
  return `${url}${separator}${parts.join('&')}`;
}
