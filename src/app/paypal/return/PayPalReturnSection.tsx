'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

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
        sessionStorage.setItem(`majesca_guest_order_${confirmedOrderId}`, JSON.stringify(responseData.guestUserOrderDetails));
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
    <div className="w-full min-h-[50vh] flex items-center justify-center px-4">
      <div className="max-w-[520px] w-full text-center">
        {error ? (
          <>
            <p className="text-[16px] text-red-600 font-sans mb-4">{error}</p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={confirm}
                className="h-[44px] px-6 bg-secondary text-white uppercase tracking-[1.5px] text-[13px] font-sans cursor-pointer border-0"
              >
                Try again
              </button>
              <button
                type="button"
                onClick={() => router.replace('/checkout')}
                className="h-[44px] px-6 border border-gray-300 uppercase tracking-[1.5px] text-[13px] font-sans cursor-pointer bg-white"
              >
                Back to checkout
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="animate-spin h-10 w-10 border-2 border-secondary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-[14px] uppercase tracking-[1.5px] text-[#5b5b5b] font-sans">
              {cancelled ? 'Returning to checkout...' : 'Confirming your PayPal payment...'}
            </p>
            <p className="text-[12px] text-gray-400 mt-1 font-sans">Please don&apos;t close this page</p>
          </>
        )}
      </div>
    </div>
  );
};

export default PayPalReturnSection;
