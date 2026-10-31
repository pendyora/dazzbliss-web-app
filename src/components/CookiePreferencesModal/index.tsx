'use client';

/**
 * CookiePreferencesModal — the per-category consent panel.
 *
 * Opened from the banner's "Manage Preferences" button and from the footer's
 * "Cookie Preferences" link, so withdrawing consent later is exactly as easy as
 * granting it.
 *
 * Accessibility: rendered in a portal on <body>, `role="dialog"` + `aria-modal`,
 * labelled by its heading and described by its intro copy, ESC closes it, focus is
 * trapped inside while open and restored to the trigger on close, and background
 * scrolling is locked.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { createPortal } from 'react-dom';

import useCookieConsent from '@/hook/useCookieConsent';
import { type ConsentPreferences, type OptionalCategory } from '@/services/cookieConsent';

/** A row in the modal. `key` is null for the locked "strictly necessary" row. */
interface CategoryRow {
  key: OptionalCategory | null;
  title: string;
  /**
   * Screen-reader-only detail naming the vendors this switch controls. Not shown
   * visually (the design is label-only), but consent still has to be informed, so
   * it stays in the accessibility tree. The full vendor list is in the Privacy Policy.
   */
  controls: string;
}

const CATEGORY_ROWS: readonly CategoryRow[] = [
  {
    key: null,
    title: 'Strictly Necessary Cookies',
    controls: 'Always enabled — required for sign-in, your bag, checkout and site security.',
  },
  {
    key: 'analytics',
    title: 'Analytics Cookies',
    controls: 'Controls Google Analytics (GA4), Google Tag Manager analytics and Microsoft Clarity.',
  },
  {
    key: 'marketing',
    title: 'Marketing Cookies',
    controls: 'Controls Meta Pixel, Google Ads conversion tracking and Google Ads remarketing.',
  },
];

/** Selector for everything that can receive keyboard focus inside the dialog. */
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function CookiePreferencesModal(): JSX.Element | null {
  const { isModalOpen, preferences, closePreferences, savePreferences } = useCookieConsent();

  const [mounted, setMounted] = useState(false);
  const [draft, setDraft] = useState<ConsentPreferences>(preferences);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // Portals need the DOM, which only exists after the first client render.
  useEffect(() => setMounted(true), []);

  // Seed the draft from the saved preferences every time the modal opens, so
  // cancelling and re-opening never shows a stale selection.
  useEffect(() => {
    if (isModalOpen) {
      setDraft(preferences);
    }
  }, [isModalOpen, preferences]);

  // Remember the trigger, move focus into the dialog, and restore it on close.
  useEffect(() => {
    if (!isModalOpen) {
      return;
    }
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    (firstFocusable ?? dialogRef.current)?.focus();

    return () => previouslyFocused.current?.focus?.();
  }, [isModalOpen]);

  // Lock background scrolling while the dialog is open.
  useEffect(() => {
    if (!isModalOpen) {
      return;
    }
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [isModalOpen]);

  /** ESC closes; Tab/Shift+Tab cycle within the dialog. */
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        closePreferences();
        return;
      }
      if (event.key !== 'Tab') {
        return;
      }
      const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
      if (focusable.length === 0) {
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === dialogRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [closePreferences],
  );

  if (!mounted || !isModalOpen) {
    return null;
  }

  const toggle = (key: OptionalCategory, next: boolean): void => setDraft((current) => ({ ...current, [key]: next }));

  return createPortal(
    <div
      className="fixed inset-0 z-[2147483600] flex items-center justify-center bg-black/50 p-4 sm:p-3"
      // Clicking the backdrop (but not the card) dismisses without saving.
      onMouseDown={(event) => event.target === event.currentTarget && closePreferences()}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-preferences-title"
        aria-describedby="cookie-preferences-description"
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className="max-h-[85vh] w-full max-w-[680px] overflow-y-auto rounded-lg bg-white p-9 text-[#111827] shadow-2xl outline-none md:p-6 sm:p-5
          dark:bg-[#1b1f24] dark:text-[#f3f4f6]"
      >
        <h2 id="cookie-preferences-title" className="m-0 text-[34px] font-bold leading-tight md:text-[28px] sm:text-[24px]">
          Cookie Preferences
        </h2>
        <p
          id="cookie-preferences-description"
          className="mb-7 mt-3 text-[19px] leading-[1.45] text-[#374151] md:text-[16px] sm:text-[15px] dark:text-[#c9ced6]"
        >
          Choose which cookies you&rsquo;d like to allow. You can update these at any time.
        </p>

        <div className="flex flex-col gap-4">
          {CATEGORY_ROWS.map((row) => {
            const locked = row.key === null;
            const checked = locked ? true : draft[row.key as OptionalCategory];
            const inputId = `cookie-category-${row.key ?? 'necessary'}`;

            return (
              <div key={inputId} className="flex items-start gap-3">
                <input
                  id={inputId}
                  type="checkbox"
                  checked={checked}
                  disabled={locked}
                  aria-describedby={`${inputId}-controls`}
                  onChange={(event) => !locked && toggle(row.key as OptionalCategory, event.target.checked)}
                  className="mt-[5px] h-[18px] w-[18px] shrink-0 cursor-pointer rounded-[3px] border-gray-300 text-[#2563eb]
                    focus:ring-2 focus:ring-[#2563eb] focus:ring-offset-1 disabled:cursor-not-allowed disabled:text-gray-400
                    dark:border-gray-600 dark:bg-transparent"
                />
                <label
                  htmlFor={inputId}
                  className={`text-[21px] font-medium leading-snug md:text-[18px] sm:text-[16px] ${locked ? '' : 'cursor-pointer'}`}
                >
                  {row.title}
                  {/* Visually hidden — see the note on CategoryRow.controls. */}
                  <span id={`${inputId}-controls`} className="sr-only">
                    {row.controls}
                  </span>
                </label>
              </div>
            );
          })}
        </div>

        <div className="mt-9 flex justify-end gap-3 sm:flex-col-reverse sm:gap-2">
          <button
            type="button"
            onClick={closePreferences}
            className="inline-flex h-[46px] items-center justify-center rounded-md bg-[#9ca3af] px-6 text-[16px] font-medium text-white
              transition-colors duration-150 hover:bg-[#8b929e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6b7280]
              focus-visible:ring-offset-2 sm:w-full sm:text-[15px]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => savePreferences(draft)}
            className="inline-flex h-[46px] items-center justify-center rounded-md bg-[#5cb85c] px-6 text-[16px] font-medium text-white
              transition-colors duration-150 hover:bg-[#4da64d] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3f8f3f]
              focus-visible:ring-offset-2 sm:w-full sm:text-[15px]"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
