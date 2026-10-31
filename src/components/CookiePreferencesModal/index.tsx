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
      className="fixed inset-0 z-[2147483600] flex items-center justify-center bg-ink/45 p-4 sm:p-3"
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
        className="max-h-[85vh] w-full max-w-[600px] overflow-y-auto rounded-none border border-line bg-paper p-10 text-ink outline-none md:p-7 sm:p-5"
      >
        <p className="m-0 mb-3 text-[10.5px] font-medium uppercase tracking-[0.22em] text-gilt">Your privacy</p>
        <h2
          id="cookie-preferences-title"
          className="m-0 font-cormorant text-[clamp(30px,3.2vw,40px)] font-normal leading-none tracking-[-0.01em] text-ink"
        >
          Cookie Preferences
        </h2>
        <p id="cookie-preferences-description" className="mb-7 mt-3 text-[14px] leading-[1.65] text-ink-soft">
          Choose which cookies you&rsquo;d like to allow. You can update these at any time.
        </p>

        <div className="flex flex-col border-t border-line">
          {CATEGORY_ROWS.map((row) => {
            const locked = row.key === null;
            const checked = locked ? true : draft[row.key as OptionalCategory];
            const inputId = `cookie-category-${row.key ?? 'necessary'}`;

            return (
              <div key={inputId} className="flex items-center gap-4 border-b border-line py-4">
                <input
                  id={inputId}
                  type="checkbox"
                  checked={checked}
                  disabled={locked}
                  aria-describedby={`${inputId}-controls`}
                  onChange={(event) => !locked && toggle(row.key as OptionalCategory, event.target.checked)}
                  className="h-[18px] w-[18px] shrink-0 cursor-pointer rounded-none border-line-strong text-ink
                    focus:ring-1 focus:ring-ink focus:ring-offset-2 disabled:cursor-not-allowed disabled:text-ink-faint"
                />
                <label htmlFor={inputId} className={`flex-1 text-[14px] font-medium leading-snug text-ink ${locked ? '' : 'cursor-pointer'}`}>
                  {row.title}
                  {/* Visually hidden — see the note on CategoryRow.controls. */}
                  <span id={`${inputId}-controls`} className="sr-only">
                    {row.controls}
                  </span>
                </label>
                {locked && <span className="text-[10.5px] uppercase tracking-[0.16em] text-ink-faint">Always on</span>}
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex justify-end gap-3 sm:flex-col-reverse sm:gap-2">
          <button
            type="button"
            onClick={closePreferences}
            className="inline-flex h-12 items-center justify-center rounded-none border border-ink bg-transparent px-8 text-[11.5px] font-medium uppercase
              tracking-[0.2em] text-ink transition-colors duration-150 hover:bg-ink hover:text-paper focus:outline-none focus-visible:ring-1
              focus-visible:ring-ink focus-visible:ring-offset-2 sm:w-full"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => savePreferences(draft)}
            className="inline-flex h-12 items-center justify-center rounded-none border border-ink bg-ink px-8 text-[11.5px] font-medium uppercase
              tracking-[0.2em] text-paper transition-colors duration-150 hover:bg-ink-hover focus:outline-none focus-visible:ring-1
              focus-visible:ring-ink focus-visible:ring-offset-2 sm:w-full"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
