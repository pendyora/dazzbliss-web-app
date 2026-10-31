'use client';

import { useEffect } from 'react';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { useAppSelector } from '@/store';

/**
 * Guard for the account-only screens. A visitor without a real (non-guest) account is sent to the
 * sign-in page carrying the page they asked for as `callbackUrl`, so signing in returns them to it
 * instead of the home page - this is what makes the "Track your order" button in the order emails
 * land on My Purchases.
 *
 * It waits for redux-persist to rehydrate before deciding: on a cold load from an email link the
 * store is still empty when the effect first runs, and redirecting then would bounce a customer who
 * is in fact signed in.
 */
export default function useRequireAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const user = useAppSelector((state) => state.auth.auth.user);
  // `_persist` is added by persistReducer at the root of the store and is not part of RootState.
  const isAuthResolved = useAppSelector((state: any) => Boolean(state?._persist?.rehydrated));
  const isAuthenticated = Boolean(user && !user?.is_guest);

  useEffect(() => {
    if (!isAuthResolved || isAuthenticated) {
      return;
    }
    const query = searchParams?.toString();
    const callbackUrl = `${pathname}${query ? `?${query}` : ''}`;
    router.replace(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }, [isAuthResolved, isAuthenticated, pathname, searchParams, router]);

  return { isAuthResolved, isAuthenticated };
}
