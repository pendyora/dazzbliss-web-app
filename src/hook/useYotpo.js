import { useEffect } from 'react';

export default function useYotpo(appKey) {
  useEffect(() => {
    // Inject the Yotpo loader once. Previously `product`/`product?.code` were in
    // the deps, but this hook is called with only an appKey (so `product`
    // defaulted to a fresh `{}` every render) — which re-ran this effect on EVERY
    // render, removing and re-injecting the loader script and remounting the whole
    // reviews widget (the blinking/flicker). The loader only needs to load once.
    if (!appKey) {
      return;
    }
    if (document.querySelector('[data-script="yotpo"]')) {
      return;
    }
    injectScript(appKey);
  }, [appKey]);
}

function injectScript(appKey) {
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://cdn-widgetsrepository.yotpo.com/v1/loader/${appKey}`;
  script.dataset.script = 'yotpo';

  document.head.append(script);
}

// Every widget we embed is a `<div class="yotpo-widget-instance" data-yotpo-instance-id=…>`
// that Yotpo RENDERS INTO, so "has this widget rendered yet?" is simply "does its
// container have children?".
//
// This deliberately does not look for Yotpo's own class names. Those differ per
// widget generation — the classic reviews widget emits `.yotpo-review-card`, the
// SEO Page widget `.yotpo-review` / `.yotpo-reviews-seo-list-item` — so a
// hard-coded list silently goes stale the moment the PDP switches widgets, and
// then the loop below either re-initialises widgets that are already on screen
// (the flicker / repeated mount-unmount) or decides a blank section is "done"
// and never retries (the section that only appears after a refresh).
const widgetInstances = () => Array.from(document.querySelectorAll('.yotpo-widget-instance'));

const allWidgetsRendered = (instances) => instances.length > 0 && instances.every((el) => el.childElementCount > 0);

// Identifies the most recent refresh request. A second call (product switch,
// grid click) makes any loop still pending from an earlier one stand down,
// so two overlapping loops can't both re-init the widgets.
let refreshRequest = 0;

export const YotpoReviewsRefresh = () => {
  if (typeof window === 'undefined') {
    return;
  }

  // The Yotpo loader can take ~10s+ to become ready (especially on mobile) and
  // its API races with the widget mount: this runs as soon as the product lands
  // in redux, which is the same commit that mounts the widget containers, so
  // initWidgets() can easily fire before they exist — it then finds nothing to
  // render and the section stays blank until a reload.
  //
  // So: wait for BOTH the loader and a settled set of containers, initialise
  // ONCE, then only re-initialise while some container is still empty (a load
  // that genuinely got stuck, or a container React mounted late), a limited
  // number of times. Every extra initWidgets() re-renders the widgets that are
  // already on screen, which is what the blinking was.
  refreshRequest += 1;
  const request = refreshRequest;
  const superseded = () => request !== refreshRequest;

  let waitAttempts = 0;
  const maxWait = 80; // poll every 300ms -> up to ~24s for the loader
  let lastCount = -1;

  let retries = 0;
  const maxRetries = 3;

  const initOnce = () => {
    const container = window.yotpoWidgetsContainer;
    if (container && typeof container.initWidgets === 'function') {
      container.initWidgets();
      return true;
    }
    return false;
  };

  // Re-check after a grace period, and only act if something is still unrendered.
  // The grace period has to outlast a normal render: Yotpo fetches the reviews
  // after initWidgets() and only then injects markup — measured at ~5-6s on a
  // cold PDP load. A shorter window (this used to be 2.5s) fires while the first
  // render is still in flight and restarts it, which is exactly the flicker.
  const retryIfStuck = () => {
    setTimeout(() => {
      if (superseded() || retries >= maxRetries || allWidgetsRendered(widgetInstances())) {
        return;
      }
      retries += 1;
      initOnce();
      retryIfStuck();
    }, 8000);
  };

  const waitForReady = () => {
    if (superseded()) {
      return;
    }
    waitAttempts += 1;

    const instances = widgetInstances();
    const loaderReady = typeof window.yotpoWidgetsContainer?.initWidgets === 'function';
    // Hold off until the loader is up AND the container count has stopped
    // changing (React is done mounting this page's widgets). Initialising while
    // they're still appearing is what forced the extra init passes — and each of
    // those tears down and rebuilds whatever had already rendered.
    const settled = instances.length > 0 && instances.length === lastCount;
    lastCount = instances.length;

    if (loaderReady && settled) {
      initOnce();
      retryIfStuck();
      return;
    }
    if (waitAttempts < maxWait) {
      setTimeout(waitForReady, 300);
    }
  };

  waitForReady();
};

// For pages rendering many independent star-rating widgets (e.g. a product grid),
// where containers keep mounting as the grid pages in, the settle/retry loop
// above buys nothing — there is no single "is the section filled?" moment to
// wait for. Here we just wait for the loader and initialise once.
export const YotpoInitWidgetsOnce = () => {
  if (typeof window === 'undefined') {
    return;
  }

  let attempts = 0;
  const maxAttempts = 80; // poll every 300ms -> up to ~24s for the loader

  const tryInit = () => {
    attempts += 1;
    const container = window.yotpoWidgetsContainer;
    if (container && typeof container.initWidgets === 'function') {
      container.initWidgets();
      return;
    }
    if (attempts < maxAttempts) {
      setTimeout(tryInit, 300);
    }
  };

  tryInit();
};
