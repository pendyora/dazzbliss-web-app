'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

import {
  apiApplyShopPayDiscount,
  apiCancelShopPayOrder,
  apiConfirmShopPayPayment,
  apiCreateShopPaySession,
  apiGetShopPayQuote,
  apiSubmitShopPayPayment,
} from '@/services/shopPayService';
import { saveWalletAddress, WalletAddress } from '@/utils/walletAddress';

// Shopify's Shop Pay Wallet SDK. Exposes `window.ShopPay.PaymentRequest`.
const SHOP_PAY_JS = 'https://cdn.shopify.com/shopifycloud/shop-js/shop-pay-payment-request.js';

// `/confirm-payment` answers `processing: true` while Shopify settles. Retried this many times,
// this far apart, before handing off to the webhook.
const CONFIRM_RETRIES = 5;
const CONFIRM_RETRY_DELAY_MS = 2000;

type ShopPayButtonProps = {
  /** Builds the `/quote` and `/create-session` body (cart items, coupon, free gift, shipping dates). */
  buildOrderData: () => any;
  /** False while there is nothing to pay for yet. */
  enabled: boolean;
  /**
   * Synchronous gate run on click, before the Shop Pay window opens (consent, gift ring size…).
   * Return false to stop. Must not await — the window would be blocked as a popup.
   */
  onBeforeClick?: () => boolean;
  /** Awaited before `/create-session` (e.g. sync a logged-in cart to the DB). */
  onBeforeCreateSession?: () => Promise<void> | void;
  /**
   * Awaited at payment confirmation, before the addresses are saved, with the buyer's email from
   * Shop Pay — so a guest gets a token for the address and submit-payment calls.
   */
  ensureBuyer?: (email?: string) => Promise<void> | void;
  /** Fired while the payment is being confirmed, so the parent can show its full-page loader. */
  onProcessingChange: (processing: boolean) => void;
  onSuccess: (responseData: any, orderId: string) => void;
  onError: (message: string) => void;
  /** Reports whether Shop Pay is usable here, so the parent can hide the tile if not. */
  onAvailabilityChange?: (available: boolean) => void;
  /** The buyer's saved addresses — reused when they confirm the same one in Shop Pay. */
  savedAddresses?: any[];
  /** Used when Shop Pay's address carries no email/phone (our Address rows need them). */
  fallbackContact?: { email?: string; phone?: string };
};

type Quote = { orderTotal: string; paymentRequest: any; shopId: any; clientId: any; debug: boolean };

const toMoney = (value: any) => Number(value).toFixed(2);
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
// Shop Pay's ShopPayContactField → our wallet-neutral address.
const fromShopPayAddress = (addr: any, fallback?: { email?: string; phone?: string }): WalletAddress => ({
  firstName: addr?.firstName,
  lastName: addr?.lastName,
  address1: addr?.address1,
  address2: addr?.address2,
  city: addr?.city,
  province: addr?.provinceCode,
  postalCode: addr?.postalCode,
  countryCode: addr?.countryCode,
  phone: addr?.phone || fallback?.phone,
  email: addr?.email || fallback?.email,
});

const errorMessage = (err: any, fallback: string) => err?.response?.data?.message || err?.message || fallback;

// The SDK's `render()` takes a CSS selector (it calls `document.querySelector` on it), not an element.
const CONTAINER_ID = 'shop-pay-button-container';

const ShopPayButton = ({
  buildOrderData,
  enabled,
  onProcessingChange,
  onSuccess,
  onError,
  onAvailabilityChange,
  onBeforeClick,
  onBeforeCreateSession,
  ensureBuyer,
  savedAddresses,
  fallbackContact,
}: ShopPayButtonProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const renderedRef = useRef(false);
  const configKeyRef = useRef<string | null>(null);
  // Server-priced quote, fetched before the click: nothing may be awaited between the click and
  // `createSession()`, or the browser blocks the Shop Pay window as a popup.
  const quoteRef = useRef<Quote | null>(null);
  // Handlers are read through refs so the SDK button's click listener, attached once, always
  // calls the latest props.
  const handlers = {
    buildOrderData,
    onProcessingChange,
    onSuccess,
    onError,
    onBeforeClick,
    onBeforeCreateSession,
    ensureBuyer,
    savedAddresses,
    fallbackContact,
  };
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const [sdkReady, setSdkReady] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [configured, setConfigured] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  const markUnavailable = useCallback(() => {
    setUnavailable(true);
    onAvailabilityChange?.(false);
  }, [onAvailabilityChange]);

  // ─── Load the SDK into <head> ─────────────────────────────────────
  useEffect(() => {
    if ((window as any).ShopPay?.PaymentRequest) {
      setSdkReady(true);
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[data-shop-pay-sdk="true"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => setSdkReady(true), { once: true });
      existingScript.addEventListener('error', () => markUnavailable(), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = SHOP_PAY_JS;
    script.async = true;
    script.dataset.shopPaySdk = 'true';
    script.onload = () => setSdkReady(true);
    script.onerror = () => markUnavailable();
    document.head.appendChild(script);
  }, [markUnavailable]);

  // ─── Quote the total ahead of the click ───────────────────────────
  // Only the fields that move the total are sent — addresses and dates do not affect the quote.
  const refreshQuote = useCallback(() => {
    const { coupon_code, free_gift, updatedCartProducts } = handlersRef.current.buildOrderData();
    setQuoteLoading(true);
    return apiGetShopPayQuote({ coupon_code, free_gift, updatedCartProducts })
      .then((res: any) => {
        const quote = res?.data?.data;
        // No credentials means Shop Pay is not set up in this environment.
        if (!quote?.shop_id || !quote?.client_id) {
          quoteRef.current = null;
          markUnavailable();
          return;
        }
        quoteRef.current = {
          orderTotal: toMoney(quote.order_total),
          paymentRequest: quote.payment_request,
          shopId: quote.shop_id,
          clientId: quote.client_id,
          debug: Boolean(quote.debug),
        };
      })
      .catch(() => {
        // Keep the last good quote; the click falls back to a "try again" message without one.
      })
      .finally(() => setQuoteLoading(false));
  }, [markUnavailable]);

  useEffect(() => {
    if (unavailable) {
      return;
    }
    refreshQuote();
  }, [buildOrderData, unavailable, refreshQuote]);

  // ─── Configure the SDK and render the official button ─────────────
  useEffect(() => {
    const quote = quoteRef.current;
    const shopPay = (window as any).ShopPay?.PaymentRequest;
    if (!sdkReady || !quote || !shopPay || !containerRef.current) {
      return;
    }
    // Re-configure only when the credentials change, not on every re-quote.
    const configKey = `${quote.shopId}|${quote.clientId}|${quote.debug}`;
    if (configKeyRef.current === configKey) {
      return;
    }
    try {
      shopPay.configure({ shopId: quote.shopId, clientId: quote.clientId, debug: quote.debug });
      configKeyRef.current = configKey;
      if (!renderedRef.current) {
        renderedRef.current = true;
        containerRef.current.innerHTML = '';
        Promise.resolve(shopPay.createButton().render(`#${CONTAINER_ID}`))
          .then(() => {
            onAvailabilityChange?.(true);
            setConfigured(true);
          })
          .catch((err: any) => {
            console.error('Shop Pay button could not be rendered', err);
            markUnavailable();
          });
        return;
      }
      setConfigured(true);
    } catch {
      markUnavailable();
    }
  }, [sdkReady, quoteLoading, markUnavailable, onAvailabilityChange]);

  // After rendering, the SDK asks Shopify whether Shop Pay is available for this shop and origin,
  // and removes its own button when it is not (Shopify Payments incomplete, Shop Pay off, or the
  // origin missing from the Shop channel's Domains allow list). Hide the tile when that happens
  // rather than leaving the buyer on an empty option.
  useEffect(() => {
    const container = containerRef.current;
    if (!configured || !container) {
      return;
    }
    const observer = new MutationObserver(() => {
      if (!container.querySelector('shop-pay-payment-request-button')) {
        console.warn('Shop Pay removed its button: Shop Pay is not available for this shop/origin. Enable debug mode for details.');
        markUnavailable();
      }
    });
    observer.observe(container, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [configured, markUnavailable]);

  const disabled = !enabled || quoteLoading || !configured;
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;

  useEffect(() => {
    const buttons = (window as any).ShopPay?.PaymentRequest?.Buttons;
    if (!renderedRef.current || !buttons) {
      return;
    }
    if (disabled) {
      buttons.disable();
    } else {
      buttons.enable();
    }
  }, [disabled, configured]);

  const cancelOrder = (orderId: string | null, orderSecret: string | null) => {
    if (orderId) {
      apiCancelShopPayOrder(orderId, orderSecret).catch(() => {});
    }
  };

  // Polls `/confirm-payment` while Shopify is still settling. Resolves with the success payload,
  // or null when it is still processing after every retry.
  const confirmPayment = async (orderId: string) => {
    for (let attempt = 0; attempt <= CONFIRM_RETRIES; attempt += 1) {
      if (attempt > 0) {
        await wait(CONFIRM_RETRY_DELAY_MS);
      }
      const res: any = await apiConfirmShopPayPayment({ order_id: orderId });
      const data = res?.data?.data;
      if (!data?.processing) {
        return data;
      }
    }
    return null;
  };

  // ─── Session, prepared ahead of the click ─────────────────────────
  // Shopify's button owns the click: its own handler looks up the active session and calls
  // `session.begin()` to open the window. So a session must already exist when the buyer clicks —
  // creating it inside our click handler runs after Shopify's, which then finds no session (the
  // first click did nothing) and, on mobile, injects a fallback Shop Pay login beside the button.
  const sessionRef = useRef<any>(null);
  const begunRef = useRef(false);

  const prepareSession = useCallback(() => {
    const shopPay = (window as any).ShopPay?.PaymentRequest;
    const quote = quoteRef.current;
    if (!shopPay || !quote) {
      return;
    }
    // A window is open — it keeps its own session; the next one is prepared when it closes.
    if (begunRef.current) {
      return;
    }
    // Replace an unopened session built from an older quote. Only one session may be active.
    if (sessionRef.current) {
      const stale = sessionRef.current;
      sessionRef.current = null;
      try {
        stale.close();
      } catch {
        /* never opened */
      }
    }

    // Console trace of the session, only when the backend runs Shop Pay in debug mode.
    const log = (...args: any[]) => {
      if (quote.debug) {
        // eslint-disable-next-line no-console
        console.info('[Shop Pay]', ...args);
      }
    };

    let session: any;
    try {
      // `payment_request` is passed unchanged — the backend prices everything.
      session = shopPay.createSession({ paymentRequest: shopPay.build(quote.paymentRequest) });
    } catch (err: any) {
      console.error('Shop Pay session could not be prepared', err);
      return;
    }
    sessionRef.current = session;
    log('session prepared', { origin: window.location.origin, orderTotal: quote.orderTotal, paymentRequest: quote.paymentRequest });

    let pendingOrderId: string | null = null;
    // Proves this browser created the pending order; the backend requires it for submit/cancel
    // while the order has no user yet.
    let orderSecret: string | null = null;
    let paid = false;

    session.addEventListener('sessionrequested', async () => {
      log('sessionrequested — calling /create-session');
      try {
        await handlersRef.current.onBeforeCreateSession?.();
        const res: any = await apiCreateShopPaySession(handlersRef.current.buildOrderData());
        const data = res?.data?.data;
        log('/create-session response', {
          pending_order_id: data?.pending_order_id,
          order_total: data?.order_total,
          token: data?.token ? `${String(data.token).slice(0, 12)}…` : data?.token,
          checkoutUrl: data?.checkoutUrl,
          sourceIdentifier: data?.sourceIdentifier,
        });
        pendingOrderId = data?.pending_order_id ?? null;
        orderSecret = data?.order_secret ?? null;
        if (!pendingOrderId || !data?.token) {
          throw new Error('Failed to start Shop Pay checkout. Please try again.');
        }
        // Price moved between the quote and the session: never let the buyer pay a total they
        // were not shown.
        if (toMoney(data.order_total) !== quote.orderTotal) {
          log('total changed', { quoted: quote.orderTotal, session: toMoney(data.order_total) });
          session.close();
          cancelOrder(pendingOrderId, orderSecret);
          refreshQuote();
          handlersRef.current.onError('Your order total has changed. Please review and try again.');
          return;
        }
        session.completeSessionRequest({ token: data.token, checkoutUrl: data.checkoutUrl, sourceIdentifier: data.sourceIdentifier });
        log('completeSessionRequest sent');
      } catch (err: any) {
        log('sessionrequested failed', err?.response?.data ?? err);
        session.close();
        cancelOrder(pendingOrderId, orderSecret);
        handlersRef.current.onError(errorMessage(err, 'Failed to start Shop Pay checkout. Please try again.'));
      }
    });

    // Required: without a completion for these two, the Shop Pay window reports "Some delivery
    // details may have changed". Shipping is free everywhere, so the request comes back unchanged.
    // The shipping address Shop Pay settled on. `paymentconfirmationrequested` does not carry it,
    // so it is remembered from here; stays null if the buyer never changed it.
    let latestShippingAddress: any = null;
    session.addEventListener('shippingaddresschanged', (ev: any) => {
      latestShippingAddress = ev?.shippingAddress ?? latestShippingAddress;
      log('shippingaddresschanged', { shippingAddress: latestShippingAddress });
      session.completeShippingAddressChange({ updatedPaymentRequest: session.paymentRequest });
    });
    session.addEventListener('deliverymethodchanged', () => {
      log('deliverymethodchanged');
      session.completeDeliveryMethodChange({ updatedPaymentRequest: session.paymentRequest });
    });

    // A code typed into the Shop Pay window. The backend re-prices the pending order and returns
    // the payment request to show; Shop Pay treats its `discountCodes` as the applied set.
    session.addEventListener('discountcodechanged', async (ev: any) => {
      const discountCodes: string[] = ev?.discountCodes ?? [];
      log('discountcodechanged', { discountCodes });
      try {
        if (!pendingOrderId) {
          throw new Error('Your order is not ready yet. Please try again.');
        }
        const res: any = await apiApplyShopPayDiscount({ order_id: pendingOrderId, order_secret: orderSecret, discount_codes: discountCodes });
        const data = res?.data?.data;
        const rejected: string[] = data?.rejected_codes ?? [];
        log('/apply-discount response', { order_total: data?.order_total, applied: data?.applied_code, rejected, reason: data?.rejection_reason });
        // The promo-code check's own reason (minimum amount, already used…) when there is one.
        const message =
          data?.rejection_reason ||
          (rejected.length === discountCodes.length
            ? `Discount code ${rejected[rejected.length - 1]} isn't valid for this order.`
            : 'Only one discount code can be used per order.');
        session.completeDiscountCodeChange({
          updatedPaymentRequest: shopPay.build(data.payment_request),
          errors: rejected.length ? [{ type: 'discountCodeError', message }] : [],
        });
      } catch (err: any) {
        log('/apply-discount failed', err?.response?.data ?? err);
        // Keep the request as it was; the buyer can retry or pay without the code.
        session.completeDiscountCodeChange({
          updatedPaymentRequest: session.paymentRequest,
          errors: [{ type: 'discountCodeError', message: errorMessage(err, 'This discount code could not be applied. Please try again.') }],
        });
      }
    });

    session.addEventListener('paymentconfirmationrequested', async (ev: any) => {
      log('paymentconfirmationrequested', { latestShippingAddress, eventShippingAddress: ev?.shippingAddress, billingAddress: ev?.billingAddress });
      try {
        // The addresses the buyer confirmed inside Shop Pay go on the order.
        const { savedAddresses: saved = [], fallbackContact: contact, ensureBuyer: identify } = handlersRef.current;
        const shippingRaw = (latestShippingAddress ?? ev?.shippingAddress)?.address1 ? (latestShippingAddress ?? ev?.shippingAddress) : null;
        const billingRaw = ev?.billingAddress?.address1 ? ev.billingAddress : shippingRaw;
        // A guest has no account yet — create/attach one from the Shop Pay email first.
        await identify?.(shippingRaw?.email || billingRaw?.email || ev?.paymentMethod?.billingAddress?.email || contact?.email || undefined);
        const deliveryAddressId = shippingRaw ? await saveWalletAddress(fromShopPayAddress(shippingRaw, contact), 1, saved) : undefined;
        const billingAddressId = billingRaw ? await saveWalletAddress(fromShopPayAddress(billingRaw, contact), 2, saved) : undefined;
        // The card the buyer chose in Shop Pay. The backend adds only this to its saved payment
        // request; every price still comes from the server.
        const paymentMethod = ev?.paymentMethod ?? session.paymentRequest?.paymentMethod;
        log('calling /submit-payment', { deliveryAddressId, billingAddressId, paymentMethod });
        await apiSubmitShopPayPayment({
          order_id: pendingOrderId as string,
          order_secret: orderSecret,
          payment_method: paymentMethod,
          delivery_address: deliveryAddressId,
          billing_address: billingAddressId,
        });
        session.completePaymentConfirmationRequest();
      } catch (err: any) {
        log('/submit-payment failed', err?.response?.data ?? err);
        session.completePaymentConfirmationRequest({
          errors: [{ type: 'generalError', message: errorMessage(err, 'Payment could not be submitted. Please try again.') }],
        });
      }
    });

    session.addEventListener('paymentcomplete', async () => {
      log('paymentcomplete');
      paid = true;
      session.close();
      const orderId = pendingOrderId as string;
      const { onProcessingChange: setProcessing } = handlersRef.current;
      setProcessing(true);
      try {
        const data = await confirmPayment(orderId);
        // Still processing after every retry: the backend webhook will confirm the order, so
        // the buyer goes to the success page for it anyway.
        handlersRef.current.onSuccess(data ?? {}, orderId);
      } catch (err: any) {
        setProcessing(false);
        handlersRef.current.onError(errorMessage(err, 'Shop Pay payment could not be confirmed. Please contact support.'));
      }
    });

    session.addEventListener('paymentattemptfailed', (ev: any) => {
      // Shop Pay shows the error in its own window and lets the buyer retry.
      console.warn('Shop Pay payment attempt failed', ev?.error);
    });

    session.addEventListener('windowclosed', () => {
      log('windowclosed', { paid, pendingOrderId });
      if (!paid) {
        cancelOrder(pendingOrderId, orderSecret);
      }
      if (sessionRef.current === session) {
        sessionRef.current = null;
        begunRef.current = false;
        // Ready for the next click.
        if (!paid) {
          prepareSession();
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshQuote]);

  // (Re)prepare whenever a new quote is configured.
  useEffect(() => {
    if (configured && !quoteLoading) {
      prepareSession();
    }
  }, [configured, quoteLoading, prepareSession]);

  // Close an unopened session when the cart unmounts, so another page can start its own.
  useEffect(
    () => () => {
      if (sessionRef.current && !begunRef.current) {
        try {
          sessionRef.current.close();
        } catch {
          /* ignore */
        }
      }
    },
    [],
  );

  // ─── Click gate ───────────────────────────────────────────────────
  // Capture phase on the container runs before Shopify's own listener on the button, so a failed
  // gate stops the click before `session.begin()` opens the window. Synchronous by design.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const onClickCapture = (event: MouseEvent) => {
      const { onError: fail, onBeforeClick: gate } = handlersRef.current;
      const block = () => {
        event.stopPropagation();
        event.preventDefault();
      };
      if (begunRef.current || disabledRef.current) {
        block();
        return;
      }
      if (gate && !gate()) {
        block();
        return;
      }
      // No session ready (the last one was closed or failed to build): build it now. Still
      // synchronous, and this capture listener runs before Shopify's, so its handler finds it.
      if (!sessionRef.current) {
        prepareSession();
      }
      if (!sessionRef.current) {
        block();
        refreshQuote();
        fail('We are still calculating your total. Please try again in a moment.');
        return;
      }
      fail('');
      begunRef.current = true;
    };
    container.addEventListener('click', onClickCapture, true);
    return () => container.removeEventListener('click', onClickCapture, true);
  }, [refreshQuote, prepareSession]);

  if (unavailable) {
    return null;
  }

  // 45px to match the cart's checkout button above it; square corners like the rest of the site. The colour and logo stay Shop's own, as the design guidelines require.
  return (
    <>
      {!configured && <div className="h-[45px] w-full bg-gray-100 animate-pulse" />}
      <div
        ref={containerRef}
        id={CONTAINER_ID}
        className="w-full"
        // Custom properties inherit into the SDK's <shop-pay-payment-request-button>.
        style={
          { '--shop-pay-button-width': '100%', '--shop-pay-button-height': '45px', '--shop-pay-button-border-radius': '0px' } as React.CSSProperties
        }
      />
    </>
  );
};

export default ShopPayButton;
