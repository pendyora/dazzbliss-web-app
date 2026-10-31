'use client';
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';
import { LuLoader } from 'react-icons/lu';

import { apiCreatePayPalExpressOrder } from '@/services/paypalService';
import { useAppDispatch, useAppSelector } from '@/store';

import { completeExpressCheckout } from './paypalExpressCheckout';

type Props = {
  /** Live cart line items to price (same shape used elsewhere in checkout). */
  cartProducts: any[];
  /** Applied coupon code, if any. */
  couponCode?: string;
  /** Whether the messaging-terms consent is accepted. When false, clicks are blocked. */
  isConsented: boolean;
  /** Called when a blocked click happens (consent missing) — parent shows the error + scrolls. */
  onConsentMissing: () => void;
  /** Optional async hook run before creating the order (e.g. sync DB cart for logged-in users). */
  onBeforeCreate?: () => Promise<void> | void;
};

/**
 * PayPal Express Checkout button for the Cart page. Creates a server-priced PayPal order
 * (shipping collected inside the PayPal popup), then completes the order end-to-end (user +
 * address records + capture) and redirects to the thank-you page — no confirmation screen.
 */
const PayPalExpressButton = ({ cartProducts, couponCode, isConsented, onConsentMissing, onBeforeCreate }: Props) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth.auth);
  // Express checkout skips the checkout page entirely, so the gift the cart is showing has to
  // travel with the capture call or the buyer pays and receives nothing.
  const giftOfferId = useAppSelector((state: any) => (state?.freeGift?.unlocked ? (state?.freeGift?.gift?.offer_id ?? null) : null));
  const giftVariantId = useAppSelector((state: any) => (state?.freeGift?.unlocked ? (state?.freeGift?.gift?.offer_variant_id ?? null) : null));
  const giftRingSizeId = useAppSelector((state: any) => (state?.freeGift?.unlocked ? (state?.freeGift?.gift?.ring_size_id ?? null) : null));
  // Sent even when true — the server re-derives the gift from the cart, so dropping the payload
  // for a refused gift would grant the offer's default rather than granting nothing.
  const giftDeclined = useAppSelector((state: any) => Boolean(state?.freeGift?.declined));
  const containerRef = useRef<HTMLDivElement | null>(null);
  const renderedRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  // Covers the click -> createOrder -> PayPal popup window, so the button cannot be clicked again
  // while the create-order request is in flight.
  const [starting, setStarting] = useState(false);
  const [renderCycle, setRenderCycle] = useState(0);
  // False until the PayPal Smart Button has actually painted into the container, so the cart can
  // show a placeholder loader instead of an empty gap while the SDK loads.
  const [buttonRendered, setButtonRendered] = useState(false);

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';

  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Keep latest props available inside PayPal SDK callbacks (avoid stale closures).
  const cartRef = useRef(cartProducts);
  const couponRef = useRef(couponCode);
  const isConsentedRef = useRef(isConsented);
  const onConsentMissingRef = useRef(onConsentMissing);
  const onBeforeCreateRef = useRef(onBeforeCreate);
  useEffect(() => {
    cartRef.current = cartProducts;
  }, [cartProducts]);
  useEffect(() => {
    couponRef.current = couponCode;
  }, [couponCode]);
  useEffect(() => {
    isConsentedRef.current = isConsented;
  }, [isConsented]);
  useEffect(() => {
    onConsentMissingRef.current = onConsentMissing;
  }, [onConsentMissing]);
  useEffect(() => {
    onBeforeCreateRef.current = onBeforeCreate;
  }, [onBeforeCreate]);

  // When a capture fails after PayPal approval, we keep the approved PayPal order id so the user
  // can safely re-attempt the SAME payment (idempotent on the backend) instead of re-approving,
  // which would create a second PayPal order and risk a double charge.
  const [retryOrderId, setRetryOrderId] = useState<string | null>(null);

  // Run the full post-approval completion for a given (already-approved) PayPal order id.
  const runComplete = async (orderID: string) => {
    if (!orderID) {
      return;
    }
    setProcessing(true);
    setError('');
    setRetryOrderId(null);
    try {
      const orderId = await completeExpressCheckout({
        paypalOrderId: orderID,
        cart: cartRef.current || [],
        couponCode: couponRef.current || null,
        user: userRef.current,
        dispatch,
        freeGift: giftVariantId
          ? { offer_id: giftOfferId, offer_variant_id: giftVariantId, ring_size_id: giftRingSizeId, declined: giftDeclined }
          : null,
      });
      router.push(`/ordersuccesfull?order_id=${orderId}`);
    } catch (err: any) {
      setProcessing(false);
      // A definite refusal (4xx), or a failure of our own before the capture was ever sent (no
      // delivery address in PayPal, address could not be mapped): nothing was taken, so show the
      // reason and give the buyer a fresh PayPal button rather than a re-check that cannot succeed.
      const status = err?.response?.status;
      if ((status >= 400 && status < 500) || !err?.isAxiosError) {
        setError(err?.response?.data?.message || err?.message || 'We could not complete your order. Please try again.');
        renderedRef.current = false;
        setRenderCycle((c) => c + 1);
        return;
      }
      // No HTTP response => network/timeout: the capture may actually have gone through, so we must
      // NOT invite a fresh payment. Keep the order id for a safe idempotent re-check instead.
      const noResponse = !err?.response;
      setRetryOrderId(orderID);
      setError(
        noResponse
          ? 'Your payment is being processed. Please do NOT pay again — if you were charged, your order is already confirmed. Tap "Verify payment" to check.'
          : 'We could not complete your order yet. Please do NOT pay again — tap "Verify payment" to try again.',
      );
      // Intentionally do NOT re-mount the PayPal button — re-approving creates a second order.
    }
  };
  const runCompleteRef = useRef(runComplete);
  useEffect(() => {
    runCompleteRef.current = runComplete;
  });

  // Auto-clear transient errors — but not while a retry is pending (the message is actionable).
  useEffect(() => {
    if (!error || retryOrderId) {
      return;
    }
    const t = window.setTimeout(() => setError(''), 5000);
    return () => window.clearTimeout(t);
  }, [error, retryOrderId]);

  // Load the PayPal JS SDK (shared script tag with the checkout Payment step).
  useEffect(() => {
    if (!clientId) {
      setError('PayPal client id is missing. Please add NEXT_PUBLIC_PAYPAL_CLIENT_ID in env.');
      return;
    }
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-paypal-sdk="true"]');
    if (existingScript) {
      if ((window as any).paypal?.Buttons) {
        setReady(true);
      } else {
        existingScript.addEventListener('load', () => setReady(true), { once: true });
      }
      return;
    }
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD&intent=capture`;
    script.async = true;
    script.dataset.paypalSdk = 'true';
    script.onload = () => setReady(true);
    script.onerror = () => setError('Unable to load PayPal. Please try again.');
    document.body.appendChild(script);
  }, [clientId]);

  // Render the real PayPal Smart Button once the SDK is ready and keep it mounted, so the SAME
  // official button is shown before and after consent (identical look, no re-mount/refresh).
  // Clicks are blocked until consent via pointer-events + a transparent overlay in the markup below.
  useEffect(() => {
    if (!ready || renderedRef.current || !containerRef.current) {
      return;
    }
    const paypal = (window as any).paypal;
    if (!paypal?.Buttons) {
      setError('PayPal is not available. Please refresh and try again.');
      return;
    }
    const container = containerRef.current;
    container.innerHTML = '';
    setButtonRendered(false);

    paypal
      .Buttons({
        style: { shape: 'rect', layout: 'horizontal', height: 45, color: 'blue', label: 'paypal', tagline: false },
        // Safety backup only — when consent is missing the click is intercepted by an overlay
        // below (so PayPal never opens). This reject avoids any edge where the overlay is bypassed.
        onClick: (_data: any, actions: any) => {
          if (!isConsentedRef.current) {
            onConsentMissingRef.current?.();
            return actions.reject();
          }
          return actions.resolve();
        },
        createOrder: async () => {
          setError('');
          setStarting(true);
          try {
            await onBeforeCreateRef.current?.();
            const cart = cartRef.current || [];
            if (!cart.length) {
              setError('Your cart is empty.');
              throw new Error('Cart is empty');
            }
            const res: any = await apiCreatePayPalExpressOrder({
              updatedCartProducts: cart,
              coupon_code: couponRef.current || undefined,
            });
            const paypalOrderId = res?.data?.data?.paypal_order_id;
            if (!paypalOrderId) {
              throw new Error('Failed to create PayPal order');
            }
            return paypalOrderId;
          } catch (err: any) {
            const message = err?.response?.data?.message || err?.message || 'Failed to start PayPal checkout.';
            setError(message);
            throw err;
          } finally {
            // Either the popup is about to take over, or we failed — release the button lock.
            setStarting(false);
          }
        },
        // Buyer approved in the popup (PayPal has collected the shipping address). Complete the
        // order (user + address + capture) via the idempotent path, then redirect to thank-you.
        onApprove: async (data: any) => {
          await runCompleteRef.current(data?.orderID);
        },
        onError: () => {
          setError('PayPal payment could not be started. Please try again.');
          setStarting(false);
          renderedRef.current = false;
          setRenderCycle((c) => c + 1);
        },
        onCancel: () => {
          setStarting(false);
          renderedRef.current = false;
          setRenderCycle((c) => c + 1);
        },
      })
      .render(container)
      .then(() => setButtonRendered(true))
      .catch(() => {
        setButtonRendered(true);
        setError('PayPal is currently unavailable. Please refresh and try again.');
      });

    renderedRef.current = true;
  }, [ready, renderCycle, router]);

  if (!clientId) {
    return null;
  }

  return (
    <div className="w-full flex flex-col gap-2">
      {processing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4" role="status" aria-live="polite">
          <div className="grid w-full max-w-[360px] justify-items-center gap-2 bg-paper px-8 py-8 text-center font-libre">
            <LuLoader className="mb-2 h-8 w-8 animate-spin text-ink" aria-hidden />
            <p className="m-0 text-[11px] font-medium uppercase tracking-[0.18em] text-ink">Completing your order...</p>
            <p className="m-0 text-[12.5px] text-ink-soft">Please don&apos;t close this page</p>
          </div>
        </div>
      )}

      {/* The real PayPal Smart Button is always mounted, so the SAME official button shows before and
          after consent (identical look, no re-mount). Overlays sit on top to (a) block clicks until
          consent is given and (b) offer a safe "Verify payment" retry after a failed capture. */}
      {/* translateZ(0) forces this wrapper (and the PayPal zoid iframe inside it) onto the page's own
          compositing layer. Without it, iOS Safari mis-composites the iframe during momentum scroll,
          painting the button at a stale viewport position so it appears "stuck" over the header. */}
      <div className="relative w-full min-h-[45px]" style={{ transform: 'translateZ(0)', WebkitTransform: 'translateZ(0)' }}>
        {/* pointer-events is disabled until consent so the SDK can never open a popup, even if the
            overlay were bypassed. */}
        <div
          ref={containerRef}
          className="w-full"
          style={{ pointerEvents: isConsented && !retryOrderId && !starting && !processing ? 'auto' : 'none' }}
        />

        {/* Cart just opened and the PayPal SDK / Smart Button has not painted yet — hold the space
            with a skeleton so the area never renders as an empty gap. */}
        {!buttonRendered && (
          <div className="absolute inset-0 z-10 flex items-center justify-center gap-2.5 bg-stone">
            <LuLoader className="h-4 w-4 animate-spin text-ink-soft" aria-hidden />
            <span className="font-libre text-[10.5px] uppercase tracking-[0.16em] text-ink-soft">Loading PayPal...</span>
          </div>
        )}

        {/* Click -> create-order is in flight: cover the button with a spinner so it reads as busy
            and cannot be clicked a second time. */}
        {starting && !retryOrderId && (
          <div className="absolute inset-0 z-10 flex cursor-not-allowed items-center justify-center gap-2.5 bg-paper/85">
            <LuLoader className="h-4 w-4 animate-spin text-ink" aria-hidden />
            <span className="font-libre text-[10.5px] uppercase tracking-[0.16em] text-ink">Redirecting to PayPal...</span>
          </div>
        )}

        {retryOrderId ? (
          <button
            type="button"
            disabled={processing}
            onClick={() => runComplete(retryOrderId)}
            className="absolute inset-0 z-30 h-[45px] w-full cursor-pointer border-0 bg-ink font-libre text-[11px] font-medium uppercase tracking-[0.18em] text-paper transition-colors hover:bg-ink-hover disabled:cursor-not-allowed disabled:bg-ink/40"
          >
            {processing ? 'Verifying…' : 'Verify payment'}
          </button>
        ) : !isConsented ? (
          /* Transparent click-catcher over the real button — shows the consent error instead of
             opening PayPal, while the identical real button stays visible underneath. */
          <div
            role="button"
            aria-label="PayPal — accept messaging terms to continue"
            className="absolute inset-0 z-20 cursor-pointer"
            onClick={() => onConsentMissing()}
          />
        ) : null}
      </div>
      {error && (
        <p role="alert" className="m-0 font-libre text-[12px] leading-[1.5] text-danger">
          {'*' + error}
        </p>
      )}
    </div>
  );
};

export default PayPalExpressButton;
