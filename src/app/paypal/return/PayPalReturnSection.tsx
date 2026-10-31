'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';
import { LuLoader } from 'react-icons/lu';

import {
  apiCancelPayPalAuthorizeNetOrder,
  apiConfirmPayPalAuthorizeNetPayment,
  clearPayPalGuestSession,
  readPayPalGuestSession,
} from '@/services/paypalService';
import { useAppDispatch, useAppSelector } from '@/store';
import { clearCartProducts, setGuestDetails } from '@/store/slices/Cart/cartSlice';

/**
 * Landing page for the PayPal-via-Authorize.Net redirect.
 *
 * PayPal sends the buyer here after they approve (or cancel) on PayPal's own page. Up to this
 * point nothing has been authorized — the money only moves when `confirm-payment` runs the
 * Authorize.Net continue transaction, which is what this page triggers.
 *
 * The `PayerID` PayPal appends to the URL is deliberately ignored: it is buyer-controlled, so
 * the backend reads the authoritative one back off the gateway. All this page needs is the
 * order number it put in the return URL itself.
 */
const PayPalReturnSection = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();

  const orderId = searchParams.get('order_id');
  const cancelled = searchParams.get('cancelled') === '1';
  const guestDetails = useAppSelector((state: any) => state.cart.guestDetails);

  const [error, setError] = useState('');
  // The redirect through PayPal wiped the (unpersisted) cart slice, so a guest's token has to be
  // put back into the store before any request goes out — the axios interceptor reads it from
  // there to set the `guest-token` header. Logged-in buyers are unaffected: their token lives in
  // localStorage and survives the round trip on its own.
  const [sessionRestored, setSessionRestored] = useState(false);

  useEffect(() => {
    if (!guestDetails?.token) {
      const parked = readPayPalGuestSession();
      if (parked?.token) {
        dispatch(setGuestDetails(parked));
      }
    }
    setSessionRestored(true);
  }, [guestDetails?.token, dispatch]);

  const confirm = useCallback(async () => {
    if (!orderId) {
      return;
    }
    setError('');
    try {
      const res: any = await apiConfirmPayPalAuthorizeNetPayment(orderId);
      const responseData = res?.data?.data;

      dispatch(clearCartProducts());
      localStorage.removeItem('cartItems');

      const confirmedOrderId = responseData?.order?.order_id || orderId;

      if (responseData?.is_guest && responseData?.guestUserOrderDetails) {
        sessionStorage.setItem(`storefront_guest_order_${confirmedOrderId}`, JSON.stringify(responseData.guestUserOrderDetails));
      }

      clearPayPalGuestSession();
      router.replace(`/ordersuccesfull?order_id=${confirmedOrderId}`);
    } catch (err: any) {
      // The payment may or may not have gone through, so this must never invite a second one.
      // "Try again" re-runs the same confirm against the same order, which the backend answers
      // idempotently — a retry can only ever settle the existing order, never charge again.
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'We could not finish your order. Please do not pay again — tap "Try again" and we will re-check your payment.',
      );
    }
  }, [orderId, dispatch, router]);

  // React 18 Strict Mode mounts effects twice in development; without this the confirm call
  // would fire twice and the second would race the first.
  const startedRef = useRef(false);

  useEffect(() => {
    // Nothing may go out before the guest session is back in the store, or the request would be
    // sent unauthenticated and rejected.
    if (!sessionRestored || startedRef.current) {
      return;
    }
    startedRef.current = true;

    if (!orderId) {
      setError('We could not identify your PayPal payment. Please start the checkout again.');
      return;
    }

    // Buyer backed out at PayPal. Nothing was authorized, so the pending order is simply
    // released and they go back to the checkout to pick another method.
    if (cancelled) {
      apiCancelPayPalAuthorizeNetOrder(orderId)
        .catch(() => {})
        .finally(() => {
          clearPayPalGuestSession();
          router.replace('/checkout');
        });
      return;
    }

    confirm();
  }, [sessionRestored, orderId, cancelled, confirm, router]);

  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center bg-paper px-4 py-16 font-libre text-ink antialiased">
      <div className="grid w-full max-w-[520px] justify-items-center gap-3.5 text-center" role="status" aria-live="polite">
        <span className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-gilt">PayPal</span>
        {error ? (
          <>
            <p role="alert" className="m-0 max-w-[46ch] border border-danger px-4 py-3 text-[13.5px] leading-[1.6] text-danger">
              {error}
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={confirm}
                className="cursor-pointer border-0 inline-flex h-12 items-center justify-center bg-ink px-8 text-[11px] font-medium uppercase tracking-[0.18em] text-paper transition-colors hover:bg-ink-hover"
              >
                Try again
              </button>
              <button
                type="button"
                onClick={() => router.replace('/checkout')}
                className="cursor-pointer inline-flex h-12 items-center justify-center border border-ink bg-transparent px-7 text-[11px] uppercase tracking-[0.18em] text-ink transition-colors hover:bg-ink hover:text-paper"
              >
                Back to checkout
              </button>
            </div>
          </>
        ) : (
          <>
            <LuLoader className="my-1 h-9 w-9 animate-spin text-ink" aria-hidden />
            <p className="m-0 font-cormorant text-[clamp(28px,3vw,40px)] font-normal leading-[1.05] text-ink">
              {cancelled ? 'Returning to checkout...' : 'Confirming your PayPal payment...'}
            </p>
            <p className="m-0 text-[13px] text-ink-soft">Please don&apos;t close this page</p>
          </>
        )}
      </div>
    </div>
  );
};

export default PayPalReturnSection;
