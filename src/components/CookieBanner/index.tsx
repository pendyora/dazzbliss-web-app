'use client';

/**
 * CookieBanner — the first-visit consent strip pinned to the bottom of the page.
 *
 * Compliance notes baked into this UI:
 *  - Renders nothing until the stored decision has been read, so there is no
 *    hydration flash and no banner for visitors who already chose.
 *  - "Reject All" and "Accept All" share identical geometry (same height, padding,
 *    font size and weight). Making rejection harder than acceptance is a dark
 *    pattern and a GDPR failure.
 *  - Links out to both the Privacy Policy and the Terms & Conditions.
 *
 * NOTE: this project's Tailwind breakpoints are max-width based (`md` = ≤769px,
 * `sm` = ≤550px), so the base classes describe desktop and the prefixed ones
 * describe smaller screens.
 */
import React from 'react';

import Link from 'next/link';

import useCookieConsent from '@/hook/useCookieConsent';

/**
 * Shared geometry for the three actions — identical for every choice.
 *
 * On mobile the three sit on one row and each takes an equal share of the width
 * (`md:flex-1`), with padding and type stepped down so even "Manage Preferences"
 * fits on a 360px screen without the row wrapping or overflowing.
 */
const ACTION_BASE =
  'inline-flex h-[44px] items-center justify-center rounded-none border px-6 text-[11px] font-medium uppercase leading-none tracking-[0.18em] ' +
  'transition-colors duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-noir-on focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-noir md:min-w-0 md:flex-1 md:px-2 md:text-center md:tracking-[0.12em] sm:px-1 sm:text-[10px] sm:tracking-[0.06em]';

/** Reject and Accept are the same weight on purpose (see the note above); Manage is the quiet text action. */
const ACTION_SOLID = `${ACTION_BASE} border-noir-on bg-noir-on text-noir hover:border-paper hover:bg-paper`;
const ACTION_OUTLINE = `${ACTION_BASE} border-noir-on/60 bg-transparent text-noir-on hover:border-noir-on hover:bg-noir-on hover:text-noir`;

export default function CookieBanner(): JSX.Element | null {
  const { isBannerVisible, acceptAll, rejectAll, openPreferences } = useCookieConsent();

  if (!isBannerVisible) {
    return null;
  }

  return (
    <section
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-[2147483000]"
      // Keeps the bar clear of the iOS home indicator / Android gesture bar.
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* A full-width navy band. Message and actions share one row on desktop: the copy
          takes every pixel the buttons do not need (`flex-1`), and the button group keeps
          its natural width. Below 769px it becomes two rows — copy on top, the three
          actions side by side underneath. */}
      <div className="border-t border-noir-on/15 bg-noir text-noir-on">
        <div className="mx-auto flex max-w-[1680px] items-center gap-10 px-[clamp(16px,3.2vw,56px)] py-5 lg:gap-6 md:flex-col md:items-stretch md:gap-4 md:py-4">
          <div className="flex-1">
            <p className="m-0 mb-1.5 text-[10.5px] font-medium uppercase tracking-[0.22em] text-gilt-soft md:text-center">Cookies</p>
            <p className="m-0 text-[13px] font-normal leading-[1.65] text-noir-on/85 md:text-center sm:text-[12px]">
              We use cookies to give you the best shopping experience—helping us show you relevant products, improve site performance, and personalize
              your journey. For more details, see our Privacy Policy and Terms &amp; Conditions.{' '}
              <Link href="/privacy-policy" className="text-noir-on underline underline-offset-4 hover:text-paper">
                Privacy Policy
              </Link>
              <span className="mx-2 inline-block" aria-hidden="true" />
              <Link href="/terms-and-conditions" className="text-noir-on underline underline-offset-4 hover:text-paper">
                Terms &amp; Conditions
              </Link>
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3 md:w-full md:justify-center md:gap-2 sm:gap-1.5">
            <button type="button" onClick={openPreferences} className={ACTION_OUTLINE}>
              Manage Preferences
            </button>
            <button type="button" onClick={rejectAll} className={ACTION_SOLID}>
              Reject All
            </button>
            <button type="button" onClick={acceptAll} className={ACTION_SOLID}>
              Accept All
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
