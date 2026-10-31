'use client';

/**
 * CookieConsent — the single mount point for the whole consent system.
 *
 * Render this once, inside <CookieConsentProvider>. It brings together the
 * consent-gated third-party tags, the first-visit banner and the preferences
 * modal, so nothing else in the app has to know the system exists (the only other
 * touchpoint is the footer's "Cookie Preferences" link, which calls
 * `openPreferences()` from the hook).
 */
import React from 'react';

import CookieBanner from '@/components/CookieBanner';
import CookiePreferencesModal from '@/components/CookiePreferencesModal';

import Trackers from './Trackers';

export default function CookieConsent(): JSX.Element {
  return (
    <>
      <Trackers />
      <CookieBanner />
      <CookiePreferencesModal />
    </>
  );
}
