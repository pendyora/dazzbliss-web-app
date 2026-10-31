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
  'inline-flex h-[44px] items-center justify-center rounded-md px-5 text-[14px] font-medium leading-none ' +
  'transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-[#242b33] md:min-w-0 md:flex-1 md:px-2 md:text-center sm:px-1 sm:text-[12px]';

export default function CookieBanner(): JSX.Element | null {
  const { isBannerVisible, acceptAll, rejectAll, openPreferences } = useCookieConsent();

  if (!isBannerVisible) {
    return null;
  }

  return (
    <section
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-[2147483000] p-3 sm:p-2"
      // Keeps the bar clear of the iOS home indicator / Android gesture bar.
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)' }}
    >
      {/* Message and actions share one row on desktop: the copy takes every pixel the
          buttons do not need (`flex-1`), and the button group keeps its natural width.
          Below 769px it becomes two rows — centred copy on top, the three actions
          side by side underneath. */}
      <div
        className="mx-auto flex max-w-[1680px] items-center gap-8 rounded-xl bg-[#242b33] px-7 py-5 text-white shadow-[0_8px_40px_rgba(0,0,0,0.45)]
          ring-1 ring-white/10 lg:gap-6 md:flex-col md:items-stretch md:gap-4 md:px-5 md:py-4 dark:bg-[#15191e]"
      >
        <p className="m-0 flex-1 text-[15px] font-normal leading-[1.55] text-white/95 lg:text-[14px] md:text-center sm:text-[13px]">
          We use cookies to give you the best shopping experience—helping us show you relevant products, improve site performance, and personalize
          your journey. For more details, see our Privacy Policy and Terms &amp; Conditions.{' '}
          <Link href="/privacy-policy" className="font-medium text-white underline underline-offset-4 hover:text-white/80">
            Privacy Policy
          </Link>
          <span className="mx-2 inline-block" aria-hidden="true" />
          <Link href="/terms-and-conditions" className="font-medium text-white underline underline-offset-4 hover:text-white/80">
            Terms &amp; Conditions
          </Link>
        </p>

        <div className="flex shrink-0 items-center gap-3 md:w-full md:justify-center md:gap-2 sm:gap-1.5">
          <button type="button" onClick={openPreferences} className={`${ACTION_BASE} bg-[#9ca3af] text-white hover:bg-[#8b929e]`}>
            Manage Preferences
          </button>
          <button type="button" onClick={rejectAll} className={`${ACTION_BASE} bg-[#ef4444] text-white hover:bg-[#dc3535]`}>
            Reject All
          </button>
          <button type="button" onClick={acceptAll} className={`${ACTION_BASE} bg-[#5cb85c] text-white hover:bg-[#4da64d]`}>
            Accept All
          </button>
        </div>
      </div>
    </section>
  );
}
