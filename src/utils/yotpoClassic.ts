// Yotpo's *classic* widget bundle (`//staticw2.yotpo.com/{app_key}/widget.js`).
// It is what powers the plain `.yotpo` elements — the Badges widget in the
// header/footer and the site-reviews main widget behind "Write a Review" — and
// is a DIFFERENT product/loader from the modern
// `cdn-widgetsrepository.yotpo.com/v1/loader/{app_key}` one injected by
// useYotpo.js for the `data-yotpo-instance-id` widgets (PDP stars, SEO page,
// homepage reviews carousel). The two must both be loaded, but this one only
// ONCE per page: injecting it a second time breaks the widgets the first
// injection already rendered.
const SCRIPT_MARKER = 'yotpo-badge';

declare global {
  interface Window {
    yotpo?: { initWidgets?: () => void };
  }
}

export const loadYotpoClassicWidgetScript = (appKey?: string) => {
  if (typeof window === 'undefined' || !appKey) {
    return;
  }
  if (document.querySelector(`[data-script="${SCRIPT_MARKER}"]`)) {
    return;
  }
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.async = true;
  script.src = `//staticw2.yotpo.com/${appKey}/widget.js`;
  script.dataset.script = SCRIPT_MARKER;
  const firstScript = document.getElementsByTagName('script')[0];
  firstScript?.parentNode?.insertBefore(script, firstScript);
};

// Asks the classic bundle to render any `.yotpo` element it hasn't rendered yet
// (it skips the ones it already initialised, so this is safe to call for a
// widget mounted after load). Returns false while the bundle is still loading.
export const initYotpoClassicWidgets = () => {
  if (typeof window === 'undefined' || typeof window.yotpo?.initWidgets !== 'function') {
    return false;
  }
  window.yotpo.initWidgets();
  return true;
};
