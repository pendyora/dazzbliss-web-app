'use client';

/**
 * CookieConsentContext — the client-side brain of the cookie-consent system.
 *
 * Responsibilities:
 *  - On mount, read the stored decision and, when one exists, replay it as a
 *    Google Consent Mode v2 `update` so tags loaded afterwards honour it.
 *  - Own the banner / modal visibility state so the banner, the modal, the gated
 *    <Trackers /> and the footer "Cookie Preferences" link all stay in sync.
 *  - Expose the three commands (accept all / reject all / save preferences), each
 *    of which routes through the single write path in `@/services/cookieConsent`.
 *
 * Consume it via the `useCookieConsent` hook rather than importing the context
 * directly.
 */
import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';

import {
  ALLOW_ALL,
  DENY_ALL,
  acceptAllConsent,
  applyConsentMode,
  getTrackingPreferences,
  readConsent,
  rejectAllConsent,
  saveConsentPreferences,
  type ConsentPreferences,
  type ConsentRecord,
} from '@/services/cookieConsent';

/** The value exposed to every consumer of the consent context. */
export interface CookieConsentContextValue {
  /** True once the stored decision has been read on the client. Nothing consent-gated should render before this flips. */
  ready: boolean;
  /** The stored decision, or null when the visitor has not chosen yet. */
  consent: ConsentRecord | null;
  /** The visitor's stored switches (what the modal shows) — falls back to "everything optional off" before a decision. */
  preferences: ConsentPreferences;
  /**
   * The switches that actually gate tags and events. Equal to `preferences` only when
   * consent is enforced; otherwise always "everything on" (see `ENFORCE_COOKIE_CONSENT`).
   */
  trackingPreferences: ConsentPreferences;
  /** Whether a valid decision exists. */
  hasDecision: boolean;
  /** Whether the bottom banner should be on screen. */
  isBannerVisible: boolean;
  /** Whether the preferences modal is open. */
  isModalOpen: boolean;
  /** Grant every optional category. */
  acceptAll: () => void;
  /** Deny every optional category and purge tracker cookies. */
  rejectAll: () => void;
  /** Commit an explicit per-category choice. */
  savePreferences: (preferences: ConsentPreferences) => void;
  /** Open the preferences modal (used by the banner and the footer link). */
  openPreferences: () => void;
  /** Close the preferences modal without saving. */
  closePreferences: () => void;
}

export const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

export function CookieConsentProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [ready, setReady] = useState(false);
  const [consent, setConsent] = useState<ConsentRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Read the stored decision on mount and replay the effective tracking switches to
  // Consent Mode, so tags that mount immediately afterwards see the correct signals.
  // When consent is not enforced this grants everything even before a decision.
  useEffect(() => {
    const stored = readConsent();
    if (stored) {
      setConsent(stored);
    }
    const tracking = getTrackingPreferences(stored);
    if (stored || tracking.analytics || tracking.marketing) {
      applyConsentMode(tracking);
    }
    setReady(true);
  }, []);

  const acceptAll = useCallback(() => {
    setConsent(acceptAllConsent());
    setIsModalOpen(false);
  }, []);

  const rejectAll = useCallback(() => {
    setConsent(rejectAllConsent());
    setIsModalOpen(false);
  }, []);

  const savePreferences = useCallback((preferences: ConsentPreferences) => {
    setConsent(saveConsentPreferences(preferences));
    setIsModalOpen(false);
  }, []);

  const openPreferences = useCallback(() => setIsModalOpen(true), []);
  const closePreferences = useCallback(() => setIsModalOpen(false), []);

  const value = useMemo<CookieConsentContextValue>(() => {
    const preferences: ConsentPreferences = consent ? { necessary: true, analytics: consent.analytics, marketing: consent.marketing } : DENY_ALL;

    return {
      ready,
      consent,
      preferences,
      trackingPreferences: getTrackingPreferences(consent),
      hasDecision: consent !== null,
      // The banner is shown only until a decision exists. Re-opening the modal from
      // the footer never brings the banner back.
      isBannerVisible: ready && consent === null,
      isModalOpen,
      acceptAll,
      rejectAll,
      savePreferences,
      openPreferences,
      closePreferences,
    };
  }, [ready, consent, isModalOpen, acceptAll, rejectAll, savePreferences, openPreferences, closePreferences]);

  return <CookieConsentContext.Provider value={value}>{children}</CookieConsentContext.Provider>;
}

/** Re-exported for convenience so consumers need only one import. */
export { ALLOW_ALL, DENY_ALL };
export type { ConsentPreferences, ConsentRecord };
