/**
 * Meta Pixel (Facebook Pixel) standard events helper.
 * All calls are SSR-safe and only run when window.fbq is available.
 *
 * Every helper is additionally gated on the visitor's MARKETING cookie consent, so
 * no pixel event can be reported before consent is granted. The pixel script
 * itself only loads with that same consent (see `@/components/CookieConsent/Trackers`).
 * While `ENFORCE_COOKIE_CONSENT` is off, `hasConsent` is always true, so events fire
 * regardless of the banner choice.
 * @see https://developers.facebook.com/docs/meta-pixel/reference
 */
import { hasConsent } from '@/services/cookieConsent';

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

const isClient = () => typeof window !== 'undefined' && typeof window.fbq === 'function';

const shouldTrack = () => isClient() && process.env.NEXT_PUBLIC_NODE_ENV === 'production' && hasConsent('marketing');

export function trackPageView(): void {
  if (!shouldTrack()) {
    return;
  }
  window.fbq!('track', 'PageView');
}

export interface ViewContentParams {
  content_ids?: string[];
  content_type?: string;
  content_name?: string;
  value?: number;
  currency?: string;
}

export function trackViewContent(params?: ViewContentParams): void {
  if (!shouldTrack()) {
    return;
  }
  window.fbq!('track', 'ViewContent', params ?? {});
}

export interface SearchParams {
  search_string: string;
}

export function trackSearch(params: SearchParams): void {
  if (!shouldTrack()) {
    return;
  }
  window.fbq!('track', 'Search', params);
}

export interface AddToCartParams {
  content_ids: string[];
  content_type?: string;
  value?: number;
  currency?: string;
  num_items?: number;
}

export function trackAddToCart(params: AddToCartParams): void {
  if (!shouldTrack()) {
    return;
  }
  window.fbq!('track', 'AddToCart', {
    content_type: 'product',
    ...params,
  });
}

export interface AddToWishlistParams {
  content_ids: string[];
  content_type?: string;
  value?: number;
  currency?: string;
}

export function trackAddToWishlist(params: AddToWishlistParams): void {
  if (!shouldTrack()) {
    return;
  }
  window.fbq!('track', 'AddToWishlist', {
    content_type: 'product',
    ...params,
  });
}

export interface InitiateCheckoutParams {
  content_ids?: string[];
  content_type?: string;
  value?: number;
  currency?: string;
  num_items?: number;
}

export function trackInitiateCheckout(params?: InitiateCheckoutParams): void {
  if (!shouldTrack()) {
    return;
  }
  window.fbq!('track', 'InitiateCheckout', params ?? {});
}

export interface AddPaymentInfoParams {
  value?: number;
  currency?: string;
}

export function trackAddPaymentInfo(params?: AddPaymentInfoParams): void {
  if (!shouldTrack()) {
    return;
  }
  window.fbq!('track', 'AddPaymentInfo', params ?? {});
}

export interface PurchaseParams {
  value: number;
  currency: string;
  order_id: string;
  content_ids?: string[];
  content_type?: string;
  num_items?: number;
}

export function trackPurchase(params: PurchaseParams): void {
  if (!shouldTrack()) {
    return;
  }
  // Pass eventID = order_id so this browser event dedupes against the server-side
  // Conversions API Purchase (which uses the same order_id as its event_id).
  const options = params.order_id ? { eventID: String(params.order_id) } : undefined;
  window.fbq!(
    'track',
    'Purchase',
    {
      content_type: 'product',
      ...params,
    },
    options,
  );
}

export interface CompleteRegistrationParams {
  status?: string;
}

export function trackCompleteRegistration(params?: CompleteRegistrationParams): void {
  if (!shouldTrack()) {
    return;
  }
  window.fbq!('track', 'CompleteRegistration', params ?? {});
}

export function trackContact(): void {
  if (!shouldTrack()) {
    return;
  }
  window.fbq!('track', 'Contact');
}

export function trackSubscribe(): void {
  if (!shouldTrack()) {
    return;
  }
  window.fbq!('track', 'Subscribe');
}
