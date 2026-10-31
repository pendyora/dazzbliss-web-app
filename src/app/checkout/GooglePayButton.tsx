'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { BRAND } from '@/config/brand';
import { apiCancelGooglePayOrder, apiCreateGooglePaySession, apiGetGooglePayQuote, apiProcessGooglePayPayment } from '@/services/googlePayService';

// Google's Pay.js SDK. Same URL for TEST and PRODUCTION — the environment is selected on
// PaymentsClient below, not by the script.
const GOOGLE_PAY_JS = process.env.NEXT_PUBLIC_GOOGLE_PAY_JS_URL;

type GooglePayButtonProps = {
  /** Builds the same order payload PayPal/Affirm send to their create endpoints. */
  buildOrderData: () => any;
  /** Fired when the charge is in flight, so the parent can show its processing overlay. */
  onProcessingChange: (processing: boolean) => void;
  onSuccess: (responseData: any, orderId: string) => void;
  onError: (message: string) => void;
  /** Reports whether Google Pay is usable here, so the parent can hide the tile if not. */
  onAvailabilityChange?: (available: boolean) => void;
};

const baseRequest = { apiVersion: 2, apiVersionMinor: 0 };

// Networks supported by Authorize.Net's Google Pay decryption.
const allowedCardNetworks = ['AMEX', 'DISCOVER', 'JCB', 'MASTERCARD', 'VISA'];
const allowedAuthMethods = ['PAN_ONLY', 'CRYPTOGRAM_3DS'];

const baseCardPaymentMethod = {
  type: 'CARD',
  parameters: {
    allowedAuthMethods,
    allowedCardNetworks,
    billingAddressRequired: true,
    billingAddressParameters: { format: 'FULL', phoneNumberRequired: false },
  },
};

// Routes the wallet token to our existing Authorize.Net merchant account. `gatewayMerchantId`
// is the Authorize.Net **Payment Gateway ID** (Merchant Interface → Account → Merchant Profile,
// listed under the business name) — NOT the API Login ID. Authorize.Net identifies the merchant
// from the ID embedded in the decrypted token, so an API Login ID here fails the charge with
// error 153 "Invalid ownership" even though the sheet and token look correct. It is a public
// identifier Google requires client-side; the Transaction Key stays server-only.
const tokenizationSpecification = {
  type: 'PAYMENT_GATEWAY',
  parameters: {
    gateway: 'authorizenet',
    gatewayMerchantId: process.env.NEXT_PUBLIC_GOOGLE_PAY_GATEWAY_MERCHANT_ID || '',
  },
};

const cardPaymentMethod = { ...baseCardPaymentMethod, tokenizationSpecification };

type Quote = { total: string; currencyCode: string; countryCode: string; merchantName: string };

const toMoney = (value: any) => Number(value).toFixed(2);

// `PAYMENT_DATA_INVALID` is what Google's reference prescribes for a declined card — the sheet then
// invites the buyer to pick another card. Everything else is `OTHER_ERROR`.
const authorizationError = (message: string, reason: 'PAYMENT_DATA_INVALID' | 'OTHER_ERROR' = 'OTHER_ERROR') => ({
  transactionState: 'ERROR',
  error: { intent: 'PAYMENT_AUTHORIZATION', message, reason },
});

const GooglePayButton = ({ buildOrderData, onProcessingChange, onSuccess, onError, onAvailabilityChange }: GooglePayButtonProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const clientRef = useRef<any>(null);
  const renderedRef = useRef(false);
  const pendingOrderIdRef = useRef<string | null>(null);
  // The server-priced total, fetched before the click. Google's integration checklist requires
  // `loadPaymentData()` to be called synchronously in the click handler — a network round-trip
  // first loses the click's user activation, and Safari/Firefox then block the payment sheet as a
  // popup. So the sheet opens with this quote, and the order is created and charged afterwards in
  // `onPaymentAuthorized`, where a different server total aborts the payment.
  const quoteRef = useRef<Quote | null>(null);
  const sheetTotalRef = useRef<string | null>(null);
  const resultRef = useRef<{ data: any; orderId: string } | null>(null);
  // Handlers are read through refs so the Google Pay button — which is created once and owns
  // its own click listener — always calls the latest props without needing a re-render.
  const handlersRef = useRef({ buildOrderData, onProcessingChange, onSuccess, onError });
  handlersRef.current = { buildOrderData, onProcessingChange, onSuccess, onError };

  const [sdkReady, setSdkReady] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  const markUnavailable = useCallback(() => {
    setUnavailable(true);
    onAvailabilityChange?.(false);
  }, [onAvailabilityChange]);

  // ─── Quote the total ahead of the click ───────────────────────────
  // `buildOrderData` changes identity whenever an input that moves the total changes (address,
  // coupon, cart, shipping dates), so the quote follows it.
  const refreshQuote = useCallback(() => {
    quoteRef.current = null;
    return apiGetGooglePayQuote(handlersRef.current.buildOrderData())
      .then((res: any) => {
        const quote = res?.data?.data;
        if (quote?.order_total === undefined || quote?.order_total === null) {
          return;
        }
        quoteRef.current = {
          total: toMoney(quote.order_total),
          currencyCode: quote.currency || 'USD',
          countryCode: quote.country_code || 'US',
          merchantName: quote.merchant_name || process.env.NEXT_PUBLIC_GOOGLE_PAY_MERCHANT_NAME || BRAND.name,
        };
      })
      .catch(() => {
        // Surfaced on click instead — the buyer may never pick Google Pay.
      });
  }, []);

  useEffect(() => {
    if (unavailable) {
      return;
    }
    refreshQuote();
  }, [buildOrderData, unavailable, refreshQuote]);

  const releasePendingOrder = () => {
    if (pendingOrderIdRef.current) {
      apiCancelGooglePayOrder(pendingOrderIdRef.current).catch(() => {});
      pendingOrderIdRef.current = null;
    }
  };

  // ─── Runs while the sheet is still open, after the buyer authorizes ──
  // Returning ERROR keeps the sheet open with the message, so the buyer can retry or close it.
  const authorizePayment = async (paymentData: any) => {
    const { buildOrderData: build, onProcessingChange: setProcessing } = handlersRef.current;
    let charging = false;

    try {
      // 1. Backend re-prices the cart and creates the pending order.
      const sessionRes: any = await apiCreateGooglePaySession(build());
      const session = sessionRes?.data?.data;
      const orderId: string | null = session?.pending_order_id ?? null;
      if (!orderId || session?.order_total === undefined || session?.order_total === null) {
        throw new Error('Failed to start Google Pay checkout. Please try again.');
      }
      pendingOrderIdRef.current = orderId;

      // 2. Never charge an amount other than the one the sheet showed.
      const serverTotal = toMoney(session.order_total);
      if (serverTotal !== sheetTotalRef.current) {
        releasePendingOrder();
        refreshQuote();
        const shown = Number(serverTotal).toLocaleString('en-US', { style: 'currency', currency: session?.currency || 'USD' });
        return authorizationError(`Your order total has changed to ${shown}. Please close this window and try again.`);
      }

      const paymentToken = paymentData?.paymentMethodData?.tokenizationData?.token;
      if (!paymentToken) {
        throw new Error('Google Pay did not return a payment token. Please try again.');
      }

      // 3. Charge the wallet token through Authorize.Net.
      charging = true;
      setProcessing(true);
      const info = paymentData?.paymentMethodData?.info;
      // `description` looks like "Visa •••• 1234"; `cardDetails` is the documented last-4 field.
      const cardDescription: string = paymentData?.paymentMethodData?.description || '';
      const res: any = await apiProcessGooglePayPayment({
        order_id: orderId,
        payment_token: paymentToken,
        card_network: info?.cardNetwork,
        card_last4: info?.cardDetails || (cardDescription ? cardDescription.slice(-4) : undefined),
      });

      pendingOrderIdRef.current = null;
      resultRef.current = { data: res?.data?.data, orderId };
      return { transactionState: 'SUCCESS' };
    } catch (err: any) {
      setProcessing(false);
      // Release the pending order so it does not sit in the admin as an unpaid order.
      releasePendingOrder();
      const message = err?.response?.data?.message || err?.message || 'Google Pay payment could not be completed. Please try again.';
      // A failure during the charge is the card being declined; anything earlier is not.
      return authorizationError(message, charging ? 'PAYMENT_DATA_INVALID' : 'OTHER_ERROR');
    }
  };
  // The PaymentsClient is created once, so it calls through a ref to reach the latest closure.
  const authorizeRef = useRef(authorizePayment);
  authorizeRef.current = authorizePayment;

  // ─── Load pay.js ──────────────────────────────────────────────────
  useEffect(() => {
    if ((window as any).google?.payments?.api) {
      setSdkReady(true);
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[data-google-pay-sdk="true"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => setSdkReady(true), { once: true });
      return;
    }

    // No URL configured — hide the tile rather than injecting an empty script src.
    if (!GOOGLE_PAY_JS) {
      markUnavailable();
      return;
    }

    const script = document.createElement('script');
    script.src = GOOGLE_PAY_JS;
    script.async = true;
    script.dataset.googlePaySdk = 'true';
    script.onload = () => setSdkReady(true);
    script.onerror = () => markUnavailable();
    document.body.appendChild(script);
  }, [markUnavailable]);

  // ─── Ask Google whether this device can pay, then render the official button ──
  useEffect(() => {
    if (!sdkReady || renderedRef.current || !containerRef.current) {
      return;
    }

    if (!process.env.NEXT_PUBLIC_GOOGLE_PAY_GATEWAY_MERCHANT_ID) {
      onError('Google Pay is not configured. Please add NEXT_PUBLIC_GOOGLE_PAY_GATEWAY_MERCHANT_ID in env.');
      markUnavailable();
      return;
    }

    let client: any;
    try {
      client = new (window as any).google.payments.api.PaymentsClient({
        environment: process.env.NEXT_PUBLIC_GOOGLE_PAY_ENVIRONMENT === 'PRODUCTION' ? 'PRODUCTION' : 'TEST',
        paymentDataCallbacks: { onPaymentAuthorized: (paymentData: any) => authorizeRef.current(paymentData) },
      });
    } catch {
      markUnavailable();
      return;
    }
    clientRef.current = client;

    client
      .isReadyToPay({ ...baseRequest, allowedPaymentMethods: [baseCardPaymentMethod] })
      .then((response: any) => {
        // `result: false` means the browser/device has no Google Pay support — not an error
        // worth surfacing; the buyer simply uses another method.
        if (!response?.result || !containerRef.current) {
          markUnavailable();
          return;
        }

        const button = client.createButton({
          onClick: handleClick,
          buttonColor: 'black',
          buttonType: 'pay',
          buttonSizeMode: 'fill',
          buttonRadius: 0,
        });
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(button);
        renderedRef.current = true;
        onAvailabilityChange?.(true);
      })
      .catch(() => markUnavailable());
    // `handleClick` is intentionally omitted — it reads live props through `handlersRef`, and
    // re-running this effect would tear down and re-render the Google Pay button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sdkReady, markUnavailable, onAvailabilityChange, onError]);

  // ─── Click → sheet ────────────────────────────────────────────────
  // Deliberately synchronous: nothing may be awaited before `loadPaymentData()`.
  const handleClick = () => {
    const { onError: fail } = handlersRef.current;
    fail('');

    const quote = quoteRef.current;
    if (!quote) {
      refreshQuote();
      fail('We are still calculating your total. Please try again in a moment.');
      return;
    }

    sheetTotalRef.current = quote.total;
    resultRef.current = null;

    const paymentDataRequest: any = {
      ...baseRequest,
      allowedPaymentMethods: [cardPaymentMethod],
      transactionInfo: {
        totalPriceStatus: 'FINAL',
        totalPrice: quote.total,
        currencyCode: quote.currencyCode,
        countryCode: quote.countryCode,
      },
      merchantInfo: {
        merchantName: quote.merchantName,
        // Only required (and only accepted) in the PRODUCTION environment.
        ...(process.env.NEXT_PUBLIC_GOOGLE_PAY_MERCHANT_ID ? { merchantId: process.env.NEXT_PUBLIC_GOOGLE_PAY_MERCHANT_ID } : {}),
      },
      callbackIntents: ['PAYMENT_AUTHORIZATION'],
    };

    clientRef.current
      .loadPaymentData(paymentDataRequest)
      .then(() => {
        // Resolves only after `onPaymentAuthorized` returned SUCCESS and the sheet closed.
        const result = resultRef.current;
        resultRef.current = null;
        if (result) {
          handlersRef.current.onSuccess(result.data, result.orderId);
        }
      })
      .catch((err: any) => {
        // The buyer closing the sheet is not a failure worth showing.
        if (err?.statusCode === 'CANCELED') {
          return;
        }
        handlersRef.current.onError(err?.statusMessage || 'Google Pay payment could not be completed. Please try again.');
      });
  };

  if (unavailable) {
    return null;
  }

  // 45px at every width. Google's brand guidelines require the Google Pay button to stay equal to or
  // larger than the other buttons here, and the tallest is PayPal's: the antd theme in AppProvider
  // sets every Button to `controlHeight: 45`, and its `h-[44px]` (no `!`) loses to that, so it renders
  // 45px at all widths. Place Order and Affirm force 44px (38px below md). The height has to be
  // explicit: `buttonSizeMode: 'fill'` renders Google's button at `height: 100%`, which collapses to
  // its intrinsic 40px against an auto-height parent.
  if (!sdkReady) {
    return <div className="h-[45px] w-full bg-gray-100 animate-pulse" />;
  }

  return <div ref={containerRef} className="h-[45px] w-full" />;
};

export default GooglePayButton;
