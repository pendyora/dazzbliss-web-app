'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { BRAND } from '@/config/brand';
import { initYotpoClassicWidgets, loadYotpoClassicWidgetScript } from '@/utils/yotpoClassic';

const YOTPO_APP_KEY = process.env.NEXT_PUBLIC_YOTPO_APP_KEY;

// Yotpo's Reviews Carousel widget has no review-submission UI of its own (its
// dashboard settings only cover layout/cards — there is no "Write a Review"
// CTA), and the modern `data-yotpo-instance-id` loader exposes no API for
// opening the review form. The form only ships as part of a *reviews widget*,
// so rather than re-implementing it against Yotpo's write API (which would mean
// owning validation, media upload, spam and email verification ourselves), this
// button drives the real thing: on click it mounts Yotpo's classic site-reviews
// widget hidden — 1px, `visibility: hidden`, out of the tab/a11y tree — and
// clicks that widget's own "Write A Review" button. Yotpo portals the resulting
// form to <body>, so the customer gets Yotpo's genuine (moderated,
// email-verified) submission modal, already centred by the
// `.modal-backdrop.yotpo-review-form-modal` rules in antd.css, while the page
// keeps our own button design.
//
// Everything is deferred to the first click, so visitors who never write a
// review pay nothing for it.
const SITE_REVIEWS_PRODUCT_ID = 'yotpo_site_reviews';
const STORE_NAME = BRAND.name;
const NATIVE_BUTTON_SELECTOR = '.yotpo-new-review-btn';
const POLL_MS = 200;
// Opening the modal hands the whole widget over to Yotpo's <body>-level portal.
// On close Yotpo sometimes puts it back into our host and sometimes doesn't, so
// wait this long for a hand-back before rebuilding the widget ourselves.
const RESTORE_GRACE_MS = 2000;
// Ceiling for the whole "load bundle → render widget → click its button" chain.
// The classic bundle can be slow on mobile; past this we surface a retry hint.
const READY_TIMEOUT_MS = 20000;

type YotpoWriteReviewProps = {
  // Wrapper classes — lets each placement own its own spacing/positioning. The
  // wrapper is deliberately NOT `relative` so a caller can pass `absolute`
  // without the two position utilities fighting.
  className?: string;
  // Wrapper inline styles — for placements whose offsets have to be computed at
  // runtime (see the homepage carousel) rather than expressed as utilities.
  style?: React.CSSProperties;
  label?: string;
  buttonClassName?: string;
};

const YotpoWriteReview = ({
  className = '',
  style,
  label = 'Write A Review',
  // Square ink button from the design system; Yotpo's own "Write A Review"
  // button on the PDP is restyled to match in the `Dazzbliss: Yotpo` CSS block.
  buttonClassName = 'inline-flex h-[42px] items-center justify-center whitespace-nowrap bg-ink px-5 font-libre text-[11px] font-medium uppercase tracking-[0.18em] text-paper transition-colors hover:bg-ink-hover sm:h-[36px] sm:px-3.5 sm:text-[10px]',
}: YotpoWriteReviewProps) => {
  const hostRef = useRef<HTMLDivElement>(null);
  // The hidden widget is only added to the DOM once the customer asks for it.
  const [widgetRequested, setWidgetRequested] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [failed, setFailed] = useState(false);
  // Set while an open request is in flight, so the effect below knows the click
  // is still wanted and a second click can't start a competing poll.
  const openRequestedRef = useRef(false);

  const clickNativeButton = useCallback(() => {
    const nativeButton = hostRef.current?.querySelector<HTMLElement>(NATIVE_BUTTON_SELECTOR);
    if (!nativeButton) {
      return false;
    }
    nativeButton.click();
    return true;
  }, []);

  // Once the widget has been requested: load the classic bundle, build the
  // widget element, and forward the click as soon as the widget has rendered its
  // own button. The element is created with the DOM API rather than in JSX
  // because Yotpo *replaces* it while rendering — leaving React to reconcile a
  // node that no longer exists. Here React only ever owns the empty host.
  useEffect(() => {
    if (!widgetRequested || !openRequestedRef.current) {
      return undefined;
    }
    loadYotpoClassicWidgetScript(YOTPO_APP_KEY);

    let cancelled = false;
    let elapsed = 0;
    let rebuilt = false;
    let initialised = false;
    let timer: ReturnType<typeof setTimeout>;

    const settle = (didFail: boolean) => {
      openRequestedRef.current = false;
      setIsOpening(false);
      setFailed(didFail);
    };

    const poll = () => {
      if (cancelled) {
        return;
      }
      if (clickNativeButton()) {
        settle(false);
        return;
      }

      const host = hostRef.current;
      // First open: the host is still empty, so build immediately. Later opens:
      // only rebuild once Yotpo has had RESTORE_GRACE_MS to hand the widget back.
      if (host && !rebuilt && (host.childElementCount === 0 || elapsed >= RESTORE_GRACE_MS)) {
        host.innerHTML = '';
        const widget = document.createElement('div');
        widget.className = 'yotpo yotpo-main-widget';
        widget.dataset.productId = SITE_REVIEWS_PRODUCT_ID;
        widget.dataset.name = STORE_NAME;
        widget.dataset.url = window.location.origin;
        host.appendChild(widget);
        rebuilt = true;
        initialised = false;
      }
      // Renders whatever we just mounted. Returns false until the bundle has
      // loaded, so this keeps retrying; once it succeeds we stop, because
      // repeating the call restarts Yotpo mid-render.
      if (!initialised) {
        initialised = initYotpoClassicWidgets();
      }

      elapsed += POLL_MS;
      if (elapsed >= READY_TIMEOUT_MS) {
        settle(true);
        return;
      }
      timer = setTimeout(poll, POLL_MS);
    };
    poll();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [widgetRequested, isOpening, clickNativeButton]);

  const handleClick = () => {
    if (isOpening) {
      return;
    }
    setFailed(false);
    // Widget still mounted from an earlier click — open straight away.
    if (clickNativeButton()) {
      return;
    }
    openRequestedRef.current = true;
    setIsOpening(true);
    setWidgetRequested(true);
  };

  if (!YOTPO_APP_KEY) {
    return null;
  }

  return (
    <div className={`flex flex-col items-end ${className}`} style={style}>
      <button type="button" onClick={handleClick} aria-busy={isOpening} className={buttonClassName}>
        {isOpening ? 'Opening…' : label}
      </button>
      {failed && (
        <p className="m-0 mt-2 text-[12px] text-danger" role="alert">
          We couldn’t open the review form. Please refresh the page and try again.
        </p>
      )}
      {/* Host for the borrowed widget: clipped to 1px, not painted and out of
          the accessibility / tab order. Kept in normal flow (rather than pushed
          off-screen) so Yotpo's own in-view rendering still fires. The form
          itself is portaled to <body>, so hiding the host never hides it. */}
      {widgetRequested && (
        <div
          ref={hostRef}
          data-yotpo-write-review-host="true"
          aria-hidden="true"
          className="pointer-events-none absolute h-px w-px overflow-hidden"
          style={{ visibility: 'hidden' }}
        />
      )}
    </div>
  );
};

export default YotpoWriteReview;
