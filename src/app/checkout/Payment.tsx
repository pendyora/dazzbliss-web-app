import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button, Form, Input, Radio } from 'antd';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';

import { Text } from '@/components';
import { apiCreateAffirmCheckout, apiCaptureAffirmCharge, apiCancelAffirmOrder, apiReportAffirmFailure } from '@/services/affirmService';
import {
  apiCreatePayPalOrder,
  apiCapturePayPalOrder,
  apiCancelPayPalOrder,
  apiCreatePayPalAuthorizeNetPayment,
  stashPayPalGuestSession,
} from '@/services/paypalService';
import { useAppDispatch, useAppSelector } from '@/store';
import { clearCartProducts } from '@/store/slices/Cart/cartSlice';
import { formatCurrency } from '@/utils/common';

import GooglePayButton from './GooglePayButton';

type PaymentProps = {
  handlePlaceOrder: (values: any) => void;
  error: string;
  cartProducts: any[];
  deliveryAddressId?: string;
  billingAddressId?: string;
  couponCode?: string;
  isGuest?: boolean;
  shippingDates?: { start: string; end: string };
  guestCartData?: any;
  setIsPlacingOrder?: (v: boolean) => void;
};

// ISO 3166-1 alpha-2 codes of the countries Affirm is offered in.
const AFFIRM_SUPPORTED_COUNTRIES = ['US', 'CA', 'GB'];

// Diagnostics for the Affirm flow, kept in production builds: the blank-modal failure only
// reproduces there. Search the browser console for "[Affirm]". Logs only which step was reached
// and yes/no flags — never order, customer, address, token or key data.
const affirmLog = (event: string, details?: Record<string, boolean | number | string | null | undefined>) => {
  // eslint-disable-next-line no-console
  console.info(`[Affirm] ${event}`, details ?? '');
};

// Emails the Ashclair inbox (via the backend) when Affirm fails on the shopper's side. Best effort:
// a failed report must never surface to the shopper.
const reportAffirmFailure = (report: Parameters<typeof apiReportAffirmFailure>[0]) => {
  affirmLog('report:sent', { stage: report.stage });
  apiReportAffirmFailure({ ...report, page_url: typeof window !== 'undefined' ? window.location.pathname : null }).catch(() => {});
};

const Payment = ({
  handlePlaceOrder,
  error,
  cartProducts,
  deliveryAddressId,
  billingAddressId,
  couponCode,
  shippingDates,
  guestCartData,
  setIsPlacingOrder,
}: PaymentProps) => {
  const { loading } = useAppSelector((s) => s.order);
  const couponData = useAppSelector((state: any) => state.cart.couponData);
  // Free Gift Above X Amount. Identifiers only — the backend re-resolves the gift and prices
  // it at $0, so nothing here can influence what is charged.
  //
  // Selected as primitives and assembled in a useMemo rather than returned as an object from
  // the selector: an object literal in a selector has a fresh identity every render, which
  // would re-run the PayPal render effect below on each one and tear down its button.
  const giftOfferId = useAppSelector((state: any) => (state?.freeGift?.unlocked ? (state?.freeGift?.gift?.offer_id ?? null) : null));
  const giftVariantId = useAppSelector((state: any) => (state?.freeGift?.unlocked ? (state?.freeGift?.gift?.offer_variant_id ?? null) : null));
  const giftRingSizeId = useAppSelector((state: any) => (state?.freeGift?.unlocked ? (state?.freeGift?.gift?.ring_size_id ?? null) : null));
  // Sent even when true — the server re-derives the gift from the cart, so dropping the payload
  // for a refused gift would grant the offer's default rather than granting nothing.
  const giftDeclined = useAppSelector((state: any) => Boolean(state?.freeGift?.declined));

  const freeGiftPayload = useMemo(
    () => (giftVariantId ? { offer_id: giftOfferId, offer_variant_id: giftVariantId, ring_size_id: giftRingSizeId, declined: giftDeclined } : null),
    [giftOfferId, giftVariantId, giftRingSizeId, giftDeclined],
  );

  // The PayPal/Affirm callbacks below are registered once and would otherwise close over a
  // stale payload if the shopper changed their gift colour afterwards.
  const freeGiftRef = useRef(freeGiftPayload);
  useEffect(() => {
    freeGiftRef.current = freeGiftPayload;
  }, [freeGiftPayload]);
  const guestDetails = useAppSelector((state: any) => state.cart.guestDetails);
  const { appraisalData, engraving }: any = useAppSelector((state) => state?.master);
  const authUser = useAppSelector((state: any) => state?.auth?.auth?.user);

  // Affirm runs its own address check and rejects a city that is not a real USPS locality.
  // A city typed by hand (kept in `city_text` because it matched no Cities master row) is
  // exactly that case, so Affirm is not offered for those addresses.
  const deliveryAddressData = guestDetails?.deliveryAddress ? guestDetails?.deliveryAddress : authUser?.delivery_address;
  const billingAddressData = guestDetails?.billingAddress ? guestDetails?.billingAddress : authUser?.billing_address;
  const hasFreeTextCity = Boolean(`${deliveryAddressData?.city_text ?? ''}`.trim() || `${billingAddressData?.city_text ?? ''}`.trim());

  // Affirm only lends to buyers in the countries its merchant account covers, and it checks
  // both addresses. The tile is hidden unless delivery and billing are both in one of them.
  const countries = useAppSelector((state: any) => state.address.countries);
  const isAffirmCountrySupported = [deliveryAddressData?.country_id, billingAddressData?.country_id].every((countryId) => {
    const iso2 = countries?.find((c: any) => String(c?.id) === String(countryId))?.iso2;
    return AFFIRM_SUPPORTED_COUNTRIES.includes(String(iso2 ?? '').toUpperCase());
  });

  const totalAmount = useMemo(() => {
    let total = 0;
    cartProducts?.forEach((item: any) => {
      const couponItem = couponData?.items?.find((el: any) => el?.sku_details?.id === item?.sku_master_id);
      const basePrice =
        couponItem?.sku_details?.coupon_discounted_price ??
        (item?.jewelry_sku?.discounted_price && item?.jewelry_sku?.discounted_price !== 0
          ? item?.jewelry_sku?.discounted_price
          : (item?.jewelry_sku?.selling_price ?? 0));
      const ringPrice = item?.ringSizePricingDetails?.rate ?? 0;
      const diamondPrice = item?.diamondDetails?.price ?? 0;
      const appraisalPrice = item?.is_appraisal ? appraisalData?.price || 0 : 0;
      const warrantyPrice = item?.selectedYearValue?.price ? item?.selectedYearValue?.price : item?.warranty_amount ? item?.warranty_amount : 0;
      const engravingPrice = item?.engravingText && item?.engravingText?.Text != '' ? engraving?.data?.engraving_price || 0 : 0;
      const count = item?.count ?? 1;
      total +=
        (Number(basePrice) + Number(ringPrice) + Number(appraisalPrice) + Number(warrantyPrice) + Number(engravingPrice)) * count +
        Number(diamondPrice);
    });
    return Math.ceil(total);
  }, [cartProducts, couponData, appraisalData, engraving]);

  const [paymentType, setPaymentType] = useState<'card' | 'paypal' | 'affirm' | 'gpay'>('card');
  const [paypalReady, setPaypalReady] = useState(false);
  const [paypalError, setPaypalError] = useState('');
  const [paypalRenderCycle, setPaypalRenderCycle] = useState(0);
  const [isProcessingPayPal, setIsProcessingPayPal] = useState(false);
  const paypalContainerRef = useRef<HTMLDivElement | null>(null);
  const paypalRenderedRef = useRef(false);
  const pendingPayPalOrderIdRef = useRef<string | null>(null);
  // Set when a capture attempt ended without a definite answer (network drop, timeout, 5xx).
  // The payment may have gone through, so the buyer is offered a re-check of the SAME PayPal
  // order (idempotent on the backend) instead of a fresh payment that could charge twice.
  const [paypalRetryOrderId, setPaypalRetryOrderId] = useState<string | null>(null);

  // Affirm state
  const [affirmReady, setAffirmReady] = useState(false);
  const [affirmError, setAffirmError] = useState('');
  const [isProcessingAffirm, setIsProcessingAffirm] = useState(false);
  const pendingAffirmOrderIdRef = useRef<string | null>(null);

  // Google Pay state — `gpayAvailable` starts false and turns on only once `isReadyToPay()` confirms
  // this device can pay. Google's integration checklist requires that: Google Pay must not be offered
  // before the check, which also means the tile never flashes up and then vanishes.
  const [gpayError, setGpayError] = useState('');
  const [isProcessingGpay, setIsProcessingGpay] = useState(false);
  const [gpayAvailable, setGpayAvailable] = useState(false);

  const dispatch = useAppDispatch();
  const router = useRouter();

  const paypalClientId = useMemo(() => process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '', []);
  const affirmPublicKey = useMemo(() => process.env.NEXT_PUBLIC_AFFIRM_PUBLIC_KEY || '', []);
  const affirmJsUrl = useMemo(() => process.env.NEXT_PUBLIC_AFFIRM_JS_URL || 'https://cdn1-sandbox.affirm.com/js/v2/affirm.js', []);

  // ─── PayPal Effects ───────────────────────────────────────────────

  useEffect(() => {
    paypalRenderedRef.current = false;
    if (paymentType === 'paypal') {
      setPaypalRenderCycle((prev) => prev + 1);
    }
  }, [paymentType]);

  // Auto-clear transient errors — but not while a re-check is pending (the message is actionable).
  useEffect(() => {
    if (!paypalError || paypalRetryOrderId) {
      return;
    }
    const timer = window.setTimeout(() => setPaypalError(''), 5000);
    return () => window.clearTimeout(timer);
  }, [paypalError, paypalRetryOrderId]);

  // The PayPal button is rendered once and its callbacks are registered then, so they read the
  // order inputs through a ref — otherwise an address or coupon changed after the button
  // appeared would be sent as it was when the button first rendered.
  const paypalOrderInputRef = useRef({ deliveryAddressId, billingAddressId, couponCode, shippingDates, guestCartData });
  useEffect(() => {
    paypalOrderInputRef.current = { deliveryAddressId, billingAddressId, couponCode, shippingDates, guestCartData };
  });

  // Capture an approved PayPal order via our API (verifies amount + finalizes order). Used by
  // the PayPal approval callback and by the "Verify payment" re-check.
  const capturePayPalOrder = async (paypalOrderId: string) => {
    if (!paypalOrderId) {
      return;
    }
    setIsProcessingPayPal(true);
    setPaypalError('');
    // Prevent checkout page from redirecting to /cart when we clear the cart
    setIsPlacingOrder?.(true);
    try {
      const res: any = await apiCapturePayPalOrder(paypalOrderId);
      const responseData = res?.data?.data;

      // Clear frontend cart
      dispatch(clearCartProducts());
      localStorage.removeItem('cartItems');

      // Extract order ID and redirect
      const orderId = responseData?.order?.order_id || responseData?.redirectUrl?.split('order_id=')?.[1];

      // Store guest order details if needed
      if (responseData?.is_guest && responseData?.guestUserOrderDetails) {
        sessionStorage.setItem(`majesca_guest_order_${orderId}`, JSON.stringify(responseData.guestUserOrderDetails));
      }

      pendingPayPalOrderIdRef.current = null; // Clear — order is confirmed
      setPaypalRetryOrderId(null);
      router.push(`/ordersuccesfull?order_id=${orderId}`);
    } catch (err: any) {
      setIsProcessingPayPal(false);
      setIsPlacingOrder?.(false);
      const status = err?.response?.status;
      if (status >= 400 && status < 500) {
        // A definite refusal: nothing was taken and the backend has released the order, so the
        // buyer can safely start a new payment.
        pendingPayPalOrderIdRef.current = null;
        setPaypalRetryOrderId(null);
        setPaypalError(err?.response?.data?.message || 'PayPal payment could not be completed. Please try again.');
        paypalRenderedRef.current = false;
        setPaypalRenderCycle((prev) => prev + 1);
        return;
      }
      // No answer, or a server error after approval: the money may already have been taken.
      setPaypalRetryOrderId(paypalOrderId);
      setPaypalError(
        'Your payment is being processed. Please do NOT pay again — if you were charged, your order is already confirmed. Tap "Verify payment" to check.',
      );
    }
  };
  const capturePayPalOrderRef = useRef(capturePayPalOrder);
  useEffect(() => {
    capturePayPalOrderRef.current = capturePayPalOrder;
  });

  // Load the PayPal JS SDK (shared script tag with the cart Express button).
  useEffect(() => {
    if (paymentType !== 'paypal') {
      return;
    }

    if (!paypalClientId) {
      setPaypalError('PayPal client id is missing. Please add NEXT_PUBLIC_PAYPAL_CLIENT_ID in env.');
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[data-paypal-sdk="true"]');
    if (existingScript) {
      if ((window as any).paypal?.Buttons) {
        setPaypalReady(true);
      } else {
        existingScript.addEventListener('load', () => setPaypalReady(true), { once: true });
      }
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(paypalClientId)}&currency=USD&intent=capture`;
    script.async = true;
    script.dataset.paypalSdk = 'true';
    script.onload = () => setPaypalReady(true);
    script.onerror = () => setPaypalError('Unable to load PayPal. Please try again.');
    document.body.appendChild(script);
  }, [paymentType, paypalClientId]);

  useEffect(() => {
    if (paymentType !== 'paypal' || !paypalReady || paypalRenderedRef.current || !paypalContainerRef.current) {
      return;
    }

    const paypal = (window as any).paypal;
    if (!paypal?.Buttons) {
      setPaypalError('PayPal is not available. Please refresh and try again.');
      return;
    }

    const container = paypalContainerRef.current;
    container.innerHTML = '';

    paypal
      .Buttons({
        style: {
          shape: 'rect',
          layout: 'horizontal',
          height: 44,
          color: 'gold',
          label: 'pay',
          tagline: false,
        },
        // Backend-controlled: create PayPal order via our API (calculates correct total server-side)
        createOrder: async () => {
          setPaypalError('');
          try {
            const input = paypalOrderInputRef.current;
            const orderData: any = {
              delivery_address: input.deliveryAddressId,
              billing_address: input.billingAddressId,
              coupon_code: input.couponCode || undefined,
              start_shipping_date: input.shippingDates?.start,
              end_shipping_date: input.shippingDates?.end,
            };

            // Always send cart items so the backend can fall back to them when the DB cart is
            // empty but Redux/localStorage still holds the buyer's selection.
            if (input.guestCartData?.length > 0) {
              orderData.updatedCartProducts = input.guestCartData;
            }
            // Identifiers only. The backend stores this on the pending order's cart_snapshot,
            // then re-resolves and re-prices it at $0 on capture — nothing here can change what
            // is charged or what is granted.
            if (freeGiftRef.current) {
              orderData.free_gift = freeGiftRef.current;
            }

            const res: any = await apiCreatePayPalOrder(orderData);
            const paypalOrderId = res?.data?.data?.paypal_order_id;

            if (!paypalOrderId) {
              throw new Error('Failed to create PayPal order');
            }

            // Track the pending order ID so we can cancel it if user cancels/errors
            pendingPayPalOrderIdRef.current = paypalOrderId;
            return paypalOrderId;
          } catch (err: any) {
            const message = err?.response?.data?.message || err?.message || 'Failed to create PayPal order.';
            setPaypalError(message);
            throw err;
          }
        },
        // Backend-controlled: capture via our API (verifies amount + finalizes order)
        onApprove: async (data: any) => {
          await capturePayPalOrderRef.current(data?.orderID);
        },
        onError: () => {
          setPaypalError('PayPal payment failed. Please try again.');
          // Cancel the pending order in backend
          if (pendingPayPalOrderIdRef.current) {
            apiCancelPayPalOrder(pendingPayPalOrderIdRef.current).catch(() => {});
            pendingPayPalOrderIdRef.current = null;
          }
          paypalRenderedRef.current = false;
          setPaypalRenderCycle((prev) => prev + 1);
        },
        onCancel: () => {
          setPaypalError('PayPal payment was cancelled.');
          // Cancel the pending order in backend
          if (pendingPayPalOrderIdRef.current) {
            apiCancelPayPalOrder(pendingPayPalOrderIdRef.current).catch(() => {});
            pendingPayPalOrderIdRef.current = null;
          }
          paypalRenderedRef.current = false;
          setPaypalRenderCycle((prev) => prev + 1);
        },
      })
      .render(container);

    paypalRenderedRef.current = true;
  }, [paymentType, paypalReady, paypalRenderCycle]);

  // ─── Affirm Effects ───────────────────────────────────────────────

  // Clear Affirm error after 5 seconds
  useEffect(() => {
    if (!affirmError) {
      return;
    }
    const timer = window.setTimeout(() => setAffirmError(''), 5000);
    return () => window.clearTimeout(timer);
  }, [affirmError]);

  // ─── Google Pay Effects ───────────────────────────────────────────

  // Clear Google Pay error after 5 seconds
  useEffect(() => {
    if (!gpayError) {
      return;
    }
    const timer = window.setTimeout(() => setGpayError(''), 5000);
    return () => window.clearTimeout(timer);
  }, [gpayError]);

  // If Google reports the device cannot pay while Google Pay is the selected method, fall
  // back to card so the buyer is never left staring at an empty payment section.
  useEffect(() => {
    if (!gpayAvailable && paymentType === 'gpay') {
      setPaymentType('card');
    }
  }, [gpayAvailable, paymentType]);

  // Same guard for Affirm: a buyer who picks it and then edits the address to a typed city
  // would otherwise be left on a method that can no longer be used.
  useEffect(() => {
    if ((hasFreeTextCity || !isAffirmCountrySupported) && paymentType === 'affirm') {
      setPaymentType('card');
    }
  }, [hasFreeTextCity, isAffirmCountrySupported, paymentType]);

  const handleGooglePayOrderData = useCallback(() => {
    const orderData: any = {
      delivery_address: deliveryAddressId,
      billing_address: billingAddressId,
      coupon_code: couponCode || undefined,
      start_shipping_date: shippingDates?.start,
      end_shipping_date: shippingDates?.end,
    };

    // Always send cart items so backend can use them as fallback
    // (handles case where DB cart is empty but Redux/localStorage has items)
    if (guestCartData?.length > 0) {
      orderData.updatedCartProducts = guestCartData;
    }
    if (freeGiftRef.current) {
      orderData.free_gift = freeGiftRef.current;
    }

    return orderData;
  }, [deliveryAddressId, billingAddressId, couponCode, shippingDates, guestCartData]);

  const handleGooglePayProcessing = useCallback(
    (processing: boolean) => {
      setIsProcessingGpay(processing);
      // Stop the checkout page redirecting to /cart while we clear the cart.
      if (processing) {
        setIsPlacingOrder?.(true);
      }
    },
    [setIsPlacingOrder],
  );

  const handleGooglePaySuccess = useCallback(
    (responseData: any, pendingOrderId: string) => {
      dispatch(clearCartProducts());
      localStorage.removeItem('cartItems');

      const orderId = responseData?.order?.order_id || pendingOrderId;

      if (responseData?.is_guest && responseData?.guestUserOrderDetails) {
        sessionStorage.setItem(`majesca_guest_order_${orderId}`, JSON.stringify(responseData.guestUserOrderDetails));
      }

      router.push(`/ordersuccesfull?order_id=${orderId}`);
    },
    [dispatch, router],
  );

  const handleGooglePayError = useCallback(
    (message: string) => {
      setGpayError(message);
      if (message) {
        setIsPlacingOrder?.(false);
      }
    },
    [setIsPlacingOrder],
  );

  // Load Affirm.js SDK when Affirm payment type is selected
  useEffect(() => {
    if (paymentType !== 'affirm') {
      return;
    }

    affirmLog('sdk:init', {
      hasPublicKey: Boolean(affirmPublicKey),
      sandboxScript: /sandbox/i.test(affirmJsUrl),
      scriptAlreadyOnPage: Boolean(document.querySelector('script[data-affirm-sdk]')),
    });

    if (!affirmPublicKey) {
      affirmLog('sdk:missing-public-key');
      setAffirmError('Affirm public key is missing. Please add NEXT_PUBLIC_AFFIRM_PUBLIC_KEY in env.');
      return;
    }

    if (!(window as any)._affirm_config) {
      (window as any)._affirm_config = {
        public_api_key: process.env.NEXT_PUBLIC_AFFIRM_PUBLIC_KEY,
        script: affirmJsUrl,
      };
    }

    if (!document.querySelector('script[data-affirm-sdk]')) {
      affirmLog('sdk:loading-script');
      const l = function (a: any, b: any, c: any) {
        return function (...args: unknown[]) {
          (a[b] as any)._.push([c, args]);
        };
      };
      const m = window as any;
      const cfg = (window as any)._affirm_config;
      const b: any = m['affirm'] || {};
      b['checkout'] = l(b, 'checkout', 'set');
      const f = b['checkout'];
      b['affirm'] = function (...args: unknown[]) {
        f.apply(b, args);
      };
      b['affirm']._ = [];
      f._ = [];
      b['affirm_' + 'checkout'] = l(b, 'affirm', 'init');
      b['ui'] = l(b, 'ui', 'set');
      b['ready'] = l(b, 'ready', 'set');

      const k = document.createElement('script');
      const p = document.getElementsByTagName('script')[0];
      k.async = true;
      k.src = cfg.script;
      k.dataset.affirmSdk = 'true';
      p.parentNode!.insertBefore(k, p);
      k.onload = () => {
        affirmLog('sdk:script-loaded', { checkoutAvailable: typeof (window as any).affirm?.checkout?.open === 'function' });
        setAffirmReady(true);
      };
      k.onerror = () => {
        affirmLog('sdk:script-failed-to-load');
        reportAffirmFailure({ stage: 'sdk_failed_to_load', error_message: 'affirm.js could not be downloaded in the browser.' });
      };
      m['affirm'] = b;
    } else {
      // SDK already loaded from PDP page
      affirmLog('sdk:reusing-existing-script', { checkoutAvailable: typeof (window as any).affirm?.checkout?.open === 'function' });
      setAffirmReady(true);
    }
  }, [paymentType, affirmPublicKey, affirmJsUrl]);

  // ─── Affirm Checkout Handler ──────────────────────────────────────

  const handleAffirmCheckout = async () => {
    setAffirmError('');
    setIsProcessingAffirm(true);
    affirmLog('checkout:clicked', { affirmReady });

    try {
      // 1. Create checkout on backend (calculates total server-side, creates pending order)
      const orderData: any = {
        delivery_address: deliveryAddressId,
        billing_address: billingAddressId,
        coupon_code: couponCode || undefined,
        start_shipping_date: shippingDates?.start,
        end_shipping_date: shippingDates?.end,
      };

      if (guestCartData?.length > 0) {
        orderData.updatedCartProducts = guestCartData;
      }
      if (freeGiftRef.current) {
        orderData.free_gift = freeGiftRef.current;
      }

      affirmLog('create-checkout:request');
      const res: any = await apiCreateAffirmCheckout(orderData);
      const responseData = res?.data?.data;
      const affirmCheckoutData = responseData?.affirm_checkout_data;
      const pendingOrderId = responseData?.pending_order_id;

      affirmLog('create-checkout:response', { hasCheckoutData: Boolean(affirmCheckoutData) });

      if (!affirmCheckoutData) {
        throw new Error('Failed to create Affirm checkout');
      }

      pendingAffirmOrderIdRef.current = pendingOrderId;

      // 2. Open Affirm modal using the checkout data from backend
      const affirm = (window as any).affirm;
      const checkoutDataWithModal = {
        ...affirmCheckoutData,
        metadata: {
          ...affirmCheckoutData.metadata,
          mode: 'modal',
        },
      };
      const checkoutAvailable = typeof affirm?.checkout?.open === 'function';
      // Still the loader's stub queue means affirm.js never took over.
      const stillStub = Array.isArray(affirm?.checkout?._);
      affirmLog('checkout:affirm-ready-check', { checkoutAvailable, stillStub });
      if (!checkoutAvailable || stillStub) {
        reportAffirmFailure({
          stage: 'sdk_not_available',
          order_id: pendingOrderId,
          error_message: !checkoutAvailable ? 'affirm.checkout.open is not a function.' : 'affirm.js never replaced the loader stub.',
        });
      }

      // A blank modal shows up as onOpen never firing. `affirmSettled` covers the shopper closing
      // the window or Affirm answering before the check runs, so neither is reported as a white screen.
      let affirmOpened = false;
      let affirmSettled = false;
      [3000, 10000].forEach((delay) => {
        window.setTimeout(() => {
          if (affirmOpened || affirmSettled) {
            return;
          }
          const affirmFrames = Array.from(document.querySelectorAll('iframe')).filter((frame) => /affirm/i.test(frame.src || frame.id || frame.name));
          const affirmFrameOnPage = affirmFrames.length > 0;
          const affirmFrameVisible = affirmFrames.some((frame) => frame.offsetWidth > 0 && frame.offsetHeight > 0);
          affirmLog(`checkout:not-opened-after-${delay}ms`, { affirmFrameOnPage, affirmFrameVisible });
          if (delay === 10000) {
            reportAffirmFailure({
              stage: 'modal_not_opened',
              order_id: pendingOrderId,
              error_message: `Affirm did not report the window as open within 10 seconds. Affirm frame on page: ${
                affirmFrameOnPage ? 'yes' : 'no'
              }, visible: ${affirmFrameVisible ? 'yes' : 'no'}.`,
            });
          }
        }, delay);
      });

      // Affirm's own error dialog (e.g. a rejected checkout object) reports here, not via onFail.
      affirm.ui?.ready?.(() => {
        affirmLog('event:ui-ready');
        affirm.ui?.error?.on?.('close', () => affirmLog('event:ui-error-close'));
      });

      affirmLog('checkout:calling-affirm.checkout');
      affirm.checkout(checkoutDataWithModal);
      affirmLog('checkout:calling-affirm.checkout.open');
      affirm.checkout.open({
        onOpen: () => {
          affirmOpened = true;
          affirmLog('event:onOpen');
        },
        onValidationError: (validationError: any) => {
          affirmSettled = true;
          const field = typeof validationError?.field === 'string' ? validationError.field : undefined;
          // Only the name of the rejected field (e.g. "billing.address.state"), never its value.
          affirmLog('event:onValidationError', { field });
          reportAffirmFailure({
            stage: 'validation_error',
            order_id: pendingOrderId,
            affirm_field: field,
            error_message: typeof validationError?.message === 'string' ? validationError.message : null,
          });
        },
        onFail: () => {
          affirmSettled = true;
          affirmLog('event:onFail');
          setIsProcessingAffirm(false);
          setAffirmError('Affirm checkout failed. Please try again.');
          if (pendingAffirmOrderIdRef.current) {
            apiCancelAffirmOrder(pendingAffirmOrderIdRef.current).catch(() => {});
            pendingAffirmOrderIdRef.current = null;
          }
        },
        onSuccess: async (data: any) => {
          affirmSettled = true;
          affirmLog('event:onSuccess', { hasCheckoutToken: Boolean(data?.checkout_token) });
          setIsProcessingAffirm(true);
          setIsPlacingOrder?.(true);
          try {
            affirmLog('capture:request');
            const res: any = await apiCaptureAffirmCharge({
              checkout_token: data.checkout_token,
              order_id: pendingOrderId,
            });
            const responseData = res?.data?.data;
            affirmLog('capture:success');

            // Clear frontend cart
            dispatch(clearCartProducts());
            localStorage.removeItem('cartItems');

            // Extract order ID and redirect
            const orderId = responseData?.order?.order_id || pendingOrderId;

            // Store guest order details if needed
            if (responseData?.is_guest && responseData?.guestUserOrderDetails) {
              sessionStorage.setItem(`majesca_guest_order_${orderId}`, JSON.stringify(responseData.guestUserOrderDetails));
            }

            pendingAffirmOrderIdRef.current = null;
            router.push(`/ordersuccesfull?order_id=${orderId}`);
          } catch (err: any) {
            affirmLog('capture:failed', { httpStatus: err?.response?.status });
            setIsProcessingAffirm(false);
            setIsPlacingOrder?.(false);
            const message = err?.response?.data?.message || err?.message || 'Affirm payment could not be completed. Please try again.';
            setAffirmError(message);
          }
        },
      });

      // Delay hiding the overlay so it stays visible while Affirm modal loads in the background
      setTimeout(() => setIsProcessingAffirm(false), 2000);
    } catch (err: any) {
      affirmLog('checkout:failed-before-modal', { httpStatus: err?.response?.status });
      // A failed create-checkout response is already emailed by the backend; only browser-side
      // failures (no HTTP response, or a script error while opening the window) are reported here.
      if (!err?.response) {
        reportAffirmFailure({
          stage: 'checkout_failed_before_modal',
          order_id: pendingAffirmOrderIdRef.current,
          error_message: err?.message || 'Unknown error before the Affirm window opened.',
        });
      }
      setIsProcessingAffirm(false);
      const message = err?.response?.data?.message || err?.message || 'Failed to start Affirm checkout.';
      setAffirmError(message);
    }
  };

  return (
    <>
      {/* PayPal processing overlay */}
      {isProcessingPayPal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white px-8 py-6 rounded-sm text-center shadow-lg">
            <div className="animate-spin h-8 w-8 border-2 border-secondary border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-[14px] uppercase tracking-[1.5px] text-[#5b5b5b] font-sans">Processing payment...</p>
            <p className="text-[12px] text-gray-400 mt-1 font-sans">Please don&apos;t close this page</p>
          </div>
        </div>
      )}

      {/* Affirm processing overlay */}
      {isProcessingAffirm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
          <div className="bg-white px-8 py-6 rounded-sm text-center shadow-lg">
            <div className="animate-spin h-8 w-8 border-2 border-secondary border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-[14px] uppercase tracking-[1.5px] text-[#5b5b5b] font-sans">Processing payment...</p>
            <p className="text-[12px] text-gray-400 mt-1 font-sans">Please don&apos;t close this page</p>
          </div>
        </div>
      )}

      {/* Google Pay processing overlay */}
      {isProcessingGpay && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
          <div className="bg-white px-8 py-6 rounded-sm text-center shadow-lg">
            <div className="animate-spin h-8 w-8 border-2 border-secondary border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-[14px] uppercase tracking-[1.5px] text-[#5b5b5b] font-sans">Processing payment...</p>
            <p className="text-[12px] text-gray-400 mt-1 font-sans">Please don&apos;t close this page</p>
          </div>
        </div>
      )}

      <div className="flex flex-col items-end gap-5 lg:gap-5">
        {/* <div className="flex flex-col items-start md:-mb-6 sm:-mb-3 gap-4 self-stretch">
          <Text as="p" size="text5xl" className="text-black-900 font-normal uppercase">
            payment
          </Text>
        </div> */}
        <div className="w-full flex flex-col gap-4">
          {/* Credit Or Debit Card option */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => {
              setPaypalError('');
              setAffirmError('');
              setGpayError('');
              setPaymentType('card');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setPaypalError('');
                setAffirmError('');
                setGpayError('');
                setPaymentType('card');
              }
            }}
            className={`w-full border p-4 md:p-3 cursor-pointer transition-colors ${paymentType === 'card' ? 'border-black-900 border-[2px]' : 'border-gray-200'}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Radio checked={paymentType === 'card'} className="pointer-events-none" />
                <Text as="p" size="textlg" className="text-black-900 text-[18px] font-normal">
                  Credit Or Debit Card
                </Text>
              </div>
              <div className="flex items-center gap-2">
                {/* Visa */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 32" className="md:h-5 h-7 w-auto">
                  <rect width="48" height="32" rx="4" fill="#1A1F71" />
                  <text
                    x="24"
                    y="20"
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="14"
                    fontWeight="bold"
                    fontFamily="Arial, sans-serif"
                    fontStyle="italic"
                  >
                    VISA
                  </text>
                </svg>
                {/* Mastercard */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 32" className="md:h-5 h-7 w-auto">
                  <rect width="48" height="32" rx="4" fill="#252525" />
                  <circle cx="19" cy="16" r="8" fill="#EB001B" />
                  <circle cx="29" cy="16" r="8" fill="#F79E1B" />
                  <path d="M24 9.8a8 8 0 0 1 0 12.4 8 8 0 0 1 0-12.4z" fill="#FF5F00" />
                </svg>
                {/* American Express */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 32" className="md:h-5 h-7 w-auto">
                  <rect width="48" height="32" rx="4" fill="#2E77BC" />
                  <text x="24" y="14" textAnchor="middle" fill="#FFFFFF" fontSize="6" fontWeight="bold" fontFamily="Arial, sans-serif">
                    AMERICAN
                  </text>
                  <text x="24" y="22" textAnchor="middle" fill="#FFFFFF" fontSize="6" fontWeight="bold" fontFamily="Arial, sans-serif">
                    EXPRESS
                  </text>
                </svg>
                {/* Discover */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 32" className="md:h-5 h-7 w-auto">
                  <rect width="48" height="32" rx="4" fill="#F1F1F1" />
                  <text x="24" y="18" textAnchor="middle" fill="#FF6000" fontSize="8" fontWeight="bold" fontFamily="Arial, sans-serif">
                    DISCOVER
                  </text>
                  <circle cx="36" cy="15" r="5" fill="#FF6000" opacity="0.3" />
                </svg>
              </div>
            </div>
          </div>

          {/* Pay with PayPal option */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => {
              setPaypalError('');
              setAffirmError('');
              setGpayError('');
              setPaymentType('paypal');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setPaypalError('');
                setAffirmError('');
                setGpayError('');
                setPaymentType('paypal');
              }
            }}
            className={`w-full border p-4 md:p-3 cursor-pointer transition-colors ${paymentType === 'paypal' ? 'border-black-900 border-[2px]' : 'border-gray-200'}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Radio checked={paymentType === 'paypal'} className="pointer-events-none" />
                <Text as="p" size="textlg" className="text-black-900 text-[18px] font-normal">
                  Pay with PayPal
                </Text>
              </div>
              <img src="/images/paypal_logo.png" alt="PayPal" className="h-6 object-contain" />
            </div>
          </div>

          {/* Buy Now, Pay Later (Affirm) option — only available for USD and supported countries */}
          {isAffirmCountrySupported && (typeof window === 'undefined' || (localStorage.getItem('currency') || 'USD') === 'USD') && (
            <div
              role="button"
              tabIndex={0}
              aria-disabled={hasFreeTextCity}
              onClick={() => {
                if (hasFreeTextCity) {
                  return;
                }
                setPaypalError('');
                setAffirmError('');
                setGpayError('');
                setPaymentType('affirm');
              }}
              onKeyDown={(e) => {
                if (hasFreeTextCity) {
                  return;
                }
                if (e.key === 'Enter' || e.key === ' ') {
                  setPaypalError('');
                  setAffirmError('');
                  setGpayError('');
                  setPaymentType('affirm');
                }
              }}
              className={`w-full border p-4 md:p-3 transition-colors ${
                hasFreeTextCity
                  ? 'cursor-not-allowed border-gray-200 opacity-50'
                  : `cursor-pointer ${paymentType === 'affirm' ? 'border-black-900 border-[2px]' : 'border-gray-200'}`
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Radio checked={paymentType === 'affirm'} disabled={hasFreeTextCity} className="pointer-events-none" />
                  <Text as="p" size="textlg" className="text-black-900 text-[18px] font-normal">
                    Buy Now, Pay Later
                  </Text>
                </div>
                <img src="/images/affirm_logo.svg" alt="Affirm" className="h-6 object-contain" />
              </div>
              {hasFreeTextCity && (
                <Text as="p" size="textxs" className="mt-2 text-[13px] font-normal text-gray-500">
                  Not available because your address uses a city that we could not verify. Pick a city from the list to pay with Affirm.
                </Text>
              )}
            </div>
          )}

          {/* Google Pay option — hidden when the device/browser cannot use Google Pay.
              Settles through the same Authorize.Net merchant account as the card flow. */}
          {gpayAvailable && (
            <div
              role="button"
              tabIndex={0}
              onClick={() => {
                setPaypalError('');
                setAffirmError('');
                setGpayError('');
                setPaymentType('gpay');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setPaypalError('');
                  setAffirmError('');
                  setGpayError('');
                  setPaymentType('gpay');
                }
              }}
              className={`w-full border p-4 md:p-3 cursor-pointer transition-colors ${paymentType === 'gpay' ? 'border-black-900 border-[2px]' : 'border-gray-200'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Radio checked={paymentType === 'gpay'} className="pointer-events-none" />
                  <Text as="p" size="textlg" className="text-black-900 text-[18px] font-normal">
                    Google Pay
                  </Text>
                </div>
                {/* Official Google Pay mark, unmodified. The brand guidelines forbid rendering it smaller than
                    any other payment option here: the card logos are h-7/md:h-5 and PayPal and Affirm are h-6,
                    so this is h-7 on desktop and h-6 below md (md:h-5 left it 4px short of PayPal on phones). */}
                <img src="/images/google-pay-mark.svg" alt="Google Pay" className="h-7 md:h-6 w-auto object-contain" />
              </div>
            </div>
          )}

          {/* Card details form */}
          {paymentType === 'card' && (
            <Form
              layout="vertical"
              onFinish={(values) => {
                handlePlaceOrder({
                  ...values,
                  payment_method: 2,
                  cardNumber: values?.cardNumber?.replace(/\s/g, ''),
                });
              }}
              className="flex flex-col gap-5 sm:gap-2 self-stretch"
            >
              <div className="flex flex-col gap-4 lg:gap-4 md:gap-[10px] sm:mb-2">
                <div className="flex">
                  <Text as="p" size="textlg" className="text-black-900 text-[20px] font-normal">
                    Enter Card Detail
                  </Text>
                </div>
              </div>
              <div className="flex flex-col ">
                <div className="grid grid-cols-2 gap-8 md:gap-4 sm:grid-col-1">
                  <Form.Item
                    name="cardName"
                    label="Name on Card"
                    rules={[
                      {
                        required: true,
                        message: 'Please enter the name on your card!',
                      },
                      {
                        validator: (_, value) => {
                          if (value) {
                            if (value.trim().length > 0) {
                              return Promise.resolve();
                            } else {
                              return Promise.reject(new Error('Name cannot be just blank spaces!'));
                            }
                          } else {
                            return Promise.reject();
                          }
                        },
                      },
                    ]}
                  >
                    <Input placeholder="Name on Card" />
                  </Form.Item>
                  <Form.Item
                    name="cardNumber"
                    normalize={(value) => {
                      if (!value) {
                        return '';
                      }
                      const digitsOnly = value.replace(/\D/g, '').slice(0, 16);
                      return digitsOnly.replace(/(.{4})/g, '$1 ').trim();
                    }}
                    label="Card Number"
                    rules={[{ required: true, message: 'Please enter your card number!' }]}
                  >
                    <Input
                      placeholder="Card Number"
                      inputMode="numeric"
                      onKeyPress={(event) => {
                        if (!/[0-9]/.test(event.key)) {
                          event.preventDefault();
                        }
                      }}
                      maxLength={19}
                    />
                  </Form.Item>
                </div>
                <div className="grid grid-cols-2 gap-8 md:gap-4 sm:grid-col-1">
                  <Form.Item
                    name="expiryDate"
                    label="Expiry Date"
                    normalize={(value) => {
                      if (!value) {
                        return '';
                      }
                      value = value.replace(/\D/g, '');

                      if (value.length > 2) {
                        value = `${value.slice(0, 2)}/${value.slice(2, 4)}`;
                      }

                      return value.slice(0, 5);
                    }}
                    rules={[
                      { required: true, message: 'Please enter the expiry date!' },
                      {
                        pattern: /^(0[1-9]|1[0-2])\/\d{2}$/,
                        message: 'Please enter a valid expiry date (MM/YY)',
                      },
                      {
                        validator: (_, value) => {
                          if (value) {
                            const [month, year] = value.split('/').map(Number);
                            const currentMonth = dayjs().month() + 1;
                            const currentYear = dayjs().year() % 100;

                            if (year < currentYear || (year === currentYear && month < currentMonth)) {
                              return Promise.reject(new Error('The expiry date cannot be in the past'));
                            }
                          }
                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <Input placeholder="MM/YY" maxLength={5} inputMode="numeric" />
                  </Form.Item>
                  <Form.Item name="cvv" label="CVV" rules={[{ required: true, message: 'Please enter your CVV!' }]}>
                    <Input
                      placeholder="CVV"
                      onKeyPress={(event) => {
                        if (!/[0-9]/.test(event.key)) {
                          event.preventDefault();
                        }
                      }}
                      inputMode="numeric"
                      maxLength={4}
                    />
                  </Form.Item>
                </div>
              </div>
              {error && <p className="text-red-500">{'*' + error}</p>}
              <Form.Item>
                <div className="flex w-full">
                  <Button
                    htmlType="submit"
                    type="default"
                    loading={loading}
                    className="!text-text_w !bg-secondary w-full !h-[44px] md:!h-[38px] flex flex-row items-center justify-center text-center uppercase tracking-[2.00px]"
                  >
                    Pay {formatCurrency(totalAmount)}
                  </Button>
                </div>
              </Form.Item>
            </Form>
          )}

          {/* Affirm payment section */}
          {paymentType === 'affirm' && (
            <div className="w-full flex flex-col gap-4">
              <div className="flex w-full">
                <Button
                  type="default"
                  loading={isProcessingAffirm}
                  disabled={!affirmReady || isProcessingAffirm}
                  onClick={handleAffirmCheckout}
                  className="!text-text_w !bg-secondary w-full !h-[44px] md:!h-[38px] flex flex-row items-center justify-center text-center uppercase tracking-[2.00px]"
                >
                  {affirmReady ? `Pay ${formatCurrency(totalAmount)}` : 'Loading Affirm...'}
                </Button>
              </div>
              {affirmError && <p className="text-red-500">{'*' + affirmError}</p>}
            </div>
          )}

          {/* PayPal payment section */}
          {paymentType === 'paypal' && (
            <div className="w-full flex flex-col gap-4">
              {/* translateZ(0) forces the PayPal zoid iframe onto the page's own compositing layer;
                  without it iOS Safari mis-composites the iframe during momentum scroll and paints
                  the button at a stale viewport position (appearing "stuck" over the header). */}
              <div
                className="w-full"
                style={{ transform: 'translateZ(0)', WebkitTransform: 'translateZ(0)', display: paypalRetryOrderId ? 'none' : undefined }}
              >
                <div ref={paypalContainerRef} />
              </div>
              {/* A capture attempt ended without a definite answer: re-check the same PayPal order
                  rather than letting the buyer approve (and possibly pay for) a second one. */}
              {paypalRetryOrderId && (
                <Button
                  type="default"
                  htmlType="button"
                  onClick={() => capturePayPalOrder(paypalRetryOrderId)}
                  loading={isProcessingPayPal}
                  disabled={isProcessingPayPal}
                  className="!text-text_w !bg-secondary w-full !h-[44px] md:!h-[38px] flex flex-row items-center justify-center text-center uppercase tracking-[2.00px]"
                >
                  Verify payment
                </Button>
              )}
              {!paypalRetryOrderId && (
                <p className="text-[13px] text-gray-600">
                  Do not switch tabs while PayPal is opening. If the popup is blocked, allow popups and click PayPal again.
                </p>
              )}
              {paypalError && <p className="text-red-500">{'*' + paypalError}</p>}
            </div>
          )}

          {/* Google Pay payment section.
              Mounted for the whole payment step (hidden when another method is selected) so
              `isReadyToPay` resolves up front — that is what lets the tile above hide itself
              on devices without Google Pay instead of the buyer selecting a dead option. */}
          <div className={paymentType === 'gpay' ? 'w-full flex flex-col gap-4' : 'hidden'} aria-hidden={paymentType !== 'gpay'}>
            <GooglePayButton
              buildOrderData={handleGooglePayOrderData}
              onProcessingChange={handleGooglePayProcessing}
              onSuccess={handleGooglePaySuccess}
              onError={handleGooglePayError}
              onAvailabilityChange={setGpayAvailable}
            />
            {gpayError && <p className="text-red-500">{'*' + gpayError}</p>}
          </div>
        </div>
      </div>
    </>
  );
};

export default Payment;
