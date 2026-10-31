'use client';

/**
 * Access the cookie-consent state and commands.
 *
 * The canonical way to read consent inside React. Anything outside React (event
 * helpers, plain utilities) should call `hasConsent()` from
 * `@/services/cookieConsent` instead.
 *
 * @throws if used outside <CookieConsentProvider>.
 */
import { useContext } from 'react';

import { CookieConsentContext, type CookieConsentContextValue } from '@/context/CookieConsentContext';

export default function useCookieConsent(): CookieConsentContextValue {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error('useCookieConsent must be used within <CookieConsentProvider>');
  }
  return context;
}

export type { CookieConsentContextValue };
