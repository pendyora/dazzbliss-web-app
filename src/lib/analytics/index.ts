/**
 * Google Analytics 4 (GA4) e-commerce analytics service.
 *
 * A single, reusable, SSR-safe wrapper around `gtag.js`. Every helper is a no-op
 * unless GA4 is enabled (a Measurement ID is configured) and `window.gtag` exists,
 * so importing/calling these functions can never break a server render or a page
 * where analytics is disabled.
 *
 * The Measurement ID is hardcoded below and must be kept in sync with the gtag.js
 * snippet in `@/components/CookieConsent/Trackers`.
 *
 * Every helper is additionally gated on the visitor's ANALYTICS cookie consent, so
 * no GA4 event can be reported before consent is granted. The gate matters because
 * the Consent Mode default snippet in `app/layout.tsx` defines `window.gtag` up
 * front, which would otherwise make these helpers look "available" pre-consent and
 * let them queue events onto the dataLayer. While `ENFORCE_COOKIE_CONSENT` is off,
 * `hasConsent` is always true, so events fire regardless of the banner choice.
 */
import { hasConsent } from '@/services/cookieConsent';

/**
 * GA4 Measurement ID, e.g. `G-XXXXXXXXXX`.
 * Replace the placeholder with the real ID — keep it identical to the value used in
 * the gtag.js `<script>` tags in `src/app/layout.tsx`.
 */
export const GA_MEASUREMENT_ID = 'G-MB1EBYGV3G';

/** Default currency for all monetary values in this store. */
export const DEFAULT_CURRENCY = 'USD';

/** GA4 `gtag` command signature. */
type GtagFn = (command: 'config' | 'event' | 'js' | 'set', targetOrName: string | Date, params?: Record<string, unknown>) => void;

declare global {
  interface Window {
    gtag?: GtagFn;
    dataLayer?: unknown[];
  }
}

/** A single GA4 e-commerce line item. */
export interface GA4Item {
  item_id: string;
  item_name?: string;
  price?: number;
  quantity?: number;
  item_category?: string;
  item_variant?: string;
  item_brand?: string;
  currency?: string;
}

/** Shared shape for the e-commerce events that operate on a list of items. */
export interface GA4ItemListEvent {
  items: GA4Item[];
  value: number;
  currency?: string;
}

/** Parameters for the `purchase` event. */
export interface GA4PurchaseEvent extends GA4ItemListEvent {
  transaction_id: string;
  tax?: number;
  shipping?: number;
  coupon?: string;
}

const isClient = (): boolean => typeof window !== 'undefined' && typeof window.gtag === 'function';

/** GA4 is enabled when a Measurement ID is configured. */
export const isGAEnabled = (): boolean => Boolean(GA_MEASUREMENT_ID);

const shouldTrack = (): boolean => isGAEnabled() && isClient() && hasConsent('analytics');

/** Round to 2 decimals to avoid floating point noise in reported revenue. */
const round2 = (n: number): number => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

const toNumber = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/**
 * Low-level event sender. Prefer the typed helpers below; use this only for
 * custom/one-off events. Safe to call anywhere — no-ops when GA4 is disabled.
 */
export function gaEvent(name: string, params: Record<string, unknown> = {}): void {
  if (!shouldTrack()) {
    return;
  }
  window.gtag!('event', name, params);
}

/**
 * Send a `page_view`. Called on every client-side route change. The gtag config
 * in the layout sets `send_page_view: false`, so this is the single source of
 * page views and never double-counts.
 */
export function pageview(url?: string): void {
  if (!shouldTrack()) {
    return;
  }
  const page_location = url ?? (typeof window !== 'undefined' ? window.location.href : undefined);
  const page_path = typeof window !== 'undefined' ? window.location.pathname + window.location.search : url;
  gaEvent('page_view', {
    page_location,
    page_path,
    page_title: typeof document !== 'undefined' ? document.title : undefined,
  });
}

/* -------------------------------------------------------------------------- */
/*                              E-commerce events                             */
/* -------------------------------------------------------------------------- */

/** GA4 `view_item` — a user viewed a product detail page. */
export function viewItem({ items, value, currency = DEFAULT_CURRENCY }: GA4ItemListEvent): void {
  gaEvent('view_item', { currency, value: round2(value), items });
}

/** GA4 `add_to_cart` — a user added one or more items to the cart. */
export function addToCart({ items, value, currency = DEFAULT_CURRENCY }: GA4ItemListEvent): void {
  gaEvent('add_to_cart', { currency, value: round2(value), items });
}

/** GA4 `view_cart` — a user viewed their cart. */
export function viewCart({ items, value, currency = DEFAULT_CURRENCY }: GA4ItemListEvent): void {
  gaEvent('view_cart', { currency, value: round2(value), items });
}

/** GA4 `begin_checkout` — a user started the checkout flow. */
export function beginCheckout({ items, value, currency = DEFAULT_CURRENCY }: GA4ItemListEvent): void {
  gaEvent('begin_checkout', { currency, value: round2(value), items });
}

/** GA4 `add_shipping_info` — a user submitted shipping information. */
export function addShippingInfo({ items, value, currency = DEFAULT_CURRENCY, shipping_tier }: GA4ItemListEvent & { shipping_tier?: string }): void {
  gaEvent('add_shipping_info', { currency, value: round2(value), shipping_tier, items });
}

/** GA4 `add_payment_info` — a user submitted/selected a payment method. */
export function addPaymentInfo({ items, value, currency = DEFAULT_CURRENCY, payment_type }: GA4ItemListEvent & { payment_type?: string }): void {
  gaEvent('add_payment_info', { currency, value: round2(value), payment_type, items });
}

/** GA4 `purchase` — an order was completed successfully. */
export function purchase({ transaction_id, items, value, currency = DEFAULT_CURRENCY, tax, shipping, coupon }: GA4PurchaseEvent): void {
  gaEvent('purchase', {
    transaction_id,
    currency,
    value: round2(value),
    ...(tax != null ? { tax: round2(tax) } : {}),
    ...(shipping != null ? { shipping: round2(shipping) } : {}),
    ...(coupon ? { coupon } : {}),
    items,
  });
}

/* -------------------------------------------------------------------------- */
/*                  Mappers: app data shapes -> GA4 item lists                 */
/* -------------------------------------------------------------------------- */

/**
 * Build a GA4 item + unit price from a product on the PDP.
 * Used for `view_item` and `add_to_cart` on the product detail page.
 */
export function buildProductItem(input: {
  item_id: string | number | undefined | null;
  item_name?: string;
  price?: number;
  quantity?: number;
  item_category?: string;
  item_variant?: string;
}): GA4Item {
  return {
    item_id: String(input.item_id ?? ''),
    item_name: input.item_name || undefined,
    price: round2(toNumber(input.price)),
    quantity: input.quantity != null ? toNumber(input.quantity) : 1,
    item_category: input.item_category || undefined,
    item_variant: input.item_variant != null ? String(input.item_variant) : undefined,
  };
}

/** Per-unit price of a cart line, including ring-size upcharge and diamond. */
const cartLineUnitPrice = (item: any): number => {
  const base = toNumber(item?.jewelry_sku?.discounted_price ?? item?.jewelry_sku?.selling_price ?? 0);
  const ring = toNumber(item?.ringSizePricingDetails?.rate ?? 0);
  const diamond = toNumber(item?.diamondDetails?.price ?? 0);
  return base + ring + diamond;
};

/**
 * Map the Redux cart/checkout line items to GA4 items and compute the total value.
 * Shared by `view_cart`, `begin_checkout`, `add_shipping_info`, `add_payment_info`.
 */
export function mapCartItemsToGA4(cartProducts: any[] | undefined | null): GA4ItemListEvent {
  const list = Array.isArray(cartProducts) ? cartProducts : [];
  let value = 0;
  const items: GA4Item[] = list.map((item: any) => {
    const unit = cartLineUnitPrice(item);
    const quantity = toNumber(item?.count ?? 1) || 1;
    value += unit * quantity;
    return {
      item_id: String(item?.sku_master_id ?? item?.sku_master ?? item?.jewelry_id ?? ''),
      item_name: item?.fullTitle ?? item?.cartJewelryDetails?.title ?? undefined,
      price: round2(unit),
      quantity,
      item_category: item?.cartJewelryDetails?.jewelrySubType?.group ?? undefined,
      item_variant: item?.jewelry_sku?.metal_type_id != null ? String(item?.jewelry_sku?.metal_type_id) : undefined,
    };
  });
  return { items, value: round2(value), currency: DEFAULT_CURRENCY };
}

/**
 * Map order line items (thank-you page) to GA4 items and compute the total value.
 * Falls back to `after_gst_amount` for the transaction value at the call site.
 */
export function mapOrderItemsToGA4(orderDetails: any): { items: GA4Item[]; itemsValue: number } {
  const list = Array.isArray(orderDetails?.orderDetails) ? orderDetails.orderDetails : [];
  let itemsValue = 0;
  const items: GA4Item[] = list.map((item: any) => {
    // What one unit actually cost: the coupon price wins over the flat discount (it is applied
    // on top of it), plus the diamond, ring-size rate and add-on fees — the same parts checkout
    // summed. A free gift is $0; its SKU price must not leak in through the fallback.
    const unit = item?.is_free_gift
      ? 0
      : toNumber(item?.jewelry_coupon_price || item?.jewelry_discount_price || item?.jewelry_price || item?.skuOrderItems?.selling_price || 0) +
        toNumber(item?.diamond_amount) +
        toNumber(item?.ring_size_rate) +
        toNumber(item?.appraisal_amount) +
        toNumber(item?.warranty_amount) +
        // `engraving_price` is stored on lines without an engraving too; it is only charged with text.
        (item?.engraving_text?.Text ? toNumber(item?.engraving_price) : 0);
    const quantity = toNumber(item?.count ?? 1) || 1;
    itemsValue += unit * quantity;
    return {
      item_id: String(item?.skuOrderItems?.id ?? item?.jewelryOrderItems?.id ?? item?.jewelry_id ?? ''),
      item_name: item?.jewelryOrderItems?.title ?? undefined,
      price: round2(unit),
      quantity,
      item_category: item?.jewelryOrderItems?.jewelrySubType?.group ?? undefined,
    };
  });
  return { items, itemsValue: round2(itemsValue) };
}
