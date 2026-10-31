/**
 * Klaviyo onsite tracking — profile identification and product-view events.
 *
 * Powers the Browse Abandonment flow: Klaviyo can only email someone who viewed a product if
 * (a) the `Viewed Product` metric fired, and (b) it knows who the visitor is. Anonymous visitors
 * are only resolvable once Klaviyo has cookied them (an email click or a Klaviyo form signup),
 * which is why `identify` is called for logged-in users — it covers everyone else.
 *
 * All calls are SSR-safe and gated on the visitor's MARKETING cookie consent, matching the
 * Meta Pixel helper. The onsite script itself loads under the same conditions, in
 * `@/components/CookieConsent/Trackers`. While `ENFORCE_COOKIE_CONSENT` is off, `hasConsent` is
 * always true, so events fire regardless of the banner choice.
 *
 * @see https://developers.klaviyo.com/en/docs/introduction_to_the_klaviyo_object
 */
import { hasConsent } from '@/services/cookieConsent';

declare global {
  interface Window {
    _learnq?: unknown[];
  }
}

/** Public (company) key. Safe to expose — it is write-only, browser-facing. */
const KLAVIYO_PUBLIC_KEY = process.env.NEXT_PUBLIC_KLAVIYO_PUBLIC_KEY || '';

/**
 * Events normally only fire in production, matching the Meta Pixel. Set
 * `NEXT_PUBLIC_KLAVIYO_DEBUG=true` to enable them locally while wiring the flow up.
 *
 * Careful: the debug override writes real profiles and events into whichever Klaviyo account
 * `NEXT_PUBLIC_KLAVIYO_PUBLIC_KEY` points at, and those events can trigger live flow emails.
 * Turn it off once testing is done.
 */
const isDebugEnabled = (): boolean => process.env.NEXT_PUBLIC_KLAVIYO_DEBUG === 'true';

const isProduction = (): boolean => process.env.NEXT_PUBLIC_NODE_ENV === 'production';

/** Klaviyo is enabled when a public key is configured and the environment allows tracking. */
export const isKlaviyoEnabled = (): boolean => Boolean(KLAVIYO_PUBLIC_KEY) && (isProduction() || isDebugEnabled());

const isClient = (): boolean => typeof window !== 'undefined';

const shouldTrack = (): boolean => isKlaviyoEnabled() && isClient() && hasConsent('marketing');

/**
 * Push onto the Klaviyo queue.
 *
 * `_learnq` is a plain array until klaviyo.js loads and replaces it with a real client, so
 * pushing before the script arrives is safe — the calls replay on load. The stub is created
 * here rather than assumed, because a PDP can render before an `afterInteractive` script runs.
 */
const push = (payload: unknown[]): void => {
  if (!shouldTrack()) {
    return;
  }
  window._learnq = window._learnq || [];
  window._learnq.push(payload);
};

export interface KlaviyoProfile {
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
}

/**
 * Associate the current browser with a Klaviyo profile.
 *
 * Without an email Klaviyo has nothing to key the profile on, so this is a no-op rather than
 * creating an unreachable anonymous record.
 */
export function identify(profile: KlaviyoProfile): void {
  if (!profile?.email) {
    return;
  }
  const traits: Record<string, unknown> = { $email: profile.email };
  if (profile.firstName) {
    traits.$first_name = profile.firstName;
  }
  if (profile.lastName) {
    traits.$last_name = profile.lastName;
  }
  if (profile.phone) {
    traits.$phone_number = profile.phone;
  }
  push(['identify', traits]);
}

export interface KlaviyoViewedProduct {
  productId: string;
  productName: string;
  sku?: string;
  categories?: string[];
  imageUrl?: string;
  url?: string;
  brand?: string;
  price?: number;
  compareAtPrice?: number;
}

/**
 * Report a product view.
 *
 * Two pushes, deliberately — they feed different things and Klaviyo needs both:
 *   `Viewed Product`   — the metric that triggers the Browse Abandonment flow.
 *   `trackViewedItem`  — populates the "Recently viewed items" block inside those emails.
 */
export function trackViewedProduct(item: KlaviyoViewedProduct): void {
  if (!item?.productId || !item?.productName) {
    return;
  }

  const event: Record<string, unknown> = {
    ProductID: item.productId,
    ProductName: item.productName,
  };
  if (item.sku) {
    event.SKU = item.sku;
  }
  if (item.categories?.length) {
    event.Categories = item.categories;
  }
  if (item.imageUrl) {
    event.ImageURL = item.imageUrl;
  }
  if (item.url) {
    event.URL = item.url;
  }
  if (item.brand) {
    event.Brand = item.brand;
  }
  if (typeof item.price === 'number') {
    // `ItemPrice`, not `Price` — this is the key the Klaviyo templates/flows on this account
    // read for a Viewed Product. Renaming it silently blanks the price in those emails.
    event.ItemPrice = item.price;
  }
  if (typeof item.compareAtPrice === 'number') {
    event.CompareAtPrice = item.compareAtPrice;
  }

  push(['track', 'Viewed Product', event]);

  push([
    'trackViewedItem',
    {
      Title: item.productName,
      ItemId: item.productId,
      Categories: item.categories ?? [],
      ImageUrl: item.imageUrl ?? '',
      Url: item.url ?? '',
      Metadata: {
        Brand: item.brand ?? '',
        Price: item.price ?? 0,
        CompareAtPrice: item.compareAtPrice ?? 0,
      },
    },
  ]);
}

export interface KlaviyoAddedToCartItem {
  productId: string;
  productName: string;
  sku?: string;
  categories?: string[];
  imageUrl?: string;
  url?: string;
  brand?: string;
  price?: number;
  quantity?: number;
}

/**
 * Report an add-to-cart.
 *
 * The metric name must stay exactly `Added to Cart` — it is the name Klaviyo's own flow
 * filters and templates reference (for example "Added to Cart zero times since starting this
 * flow", used to stop a Browse Abandonment email once the shopper has actually added the item).
 * Renaming it means editing every flow that references it.
 */
export function trackAddedToCart(item: KlaviyoAddedToCartItem): void {
  if (!item?.productId || !item?.productName) {
    return;
  }

  const quantity = item.quantity ?? 1;
  const price = Number(item.price ?? 0);

  const event: Record<string, unknown> = {
    ProductID: item.productId,
    ProductName: item.productName,
    Quantity: quantity,
    // `$value` is the reserved property Klaviyo reads as the event's monetary worth.
    $value: price * quantity,
  };
  if (item.sku) {
    event.SKU = item.sku;
  }
  if (item.categories?.length) {
    event.Categories = item.categories;
  }
  if (item.imageUrl) {
    event.ImageURL = item.imageUrl;
  }
  if (item.url) {
    event.URL = item.url;
  }
  if (item.brand) {
    event.Brand = item.brand;
  }
  if (item.price !== undefined) {
    event.Price = price;
  }

  push(['track', 'Added to Cart', event]);
}

export interface KlaviyoCheckoutLine {
  productId: string;
  productName: string;
  sku?: string;
  quantity: number;
  price: number;
  categories?: string[];
  imageUrl?: string;
  productUrl?: string;
  brand?: string;
}

export interface KlaviyoStartedCheckout {
  value: number;
  checkoutUrl?: string;
  items: KlaviyoCheckoutLine[];
}

/**
 * Report a checkout start — the trigger for the Abandoned Cart flow.
 *
 * Shape follows Klaviyo's documented `Started Checkout` payload: the reserved `$value` for the
 * cart total, flat `ItemNames`/`Categories` arrays for use in template subject lines, and a
 * nested `Items` array for the product block in the email.
 *
 * `$event_id` is what Klaviyo dedupes on. A fresh id per checkout start is deliberate — reusing
 * one would make Klaviyo drop every later event, so a shopper who abandoned, came back and
 * abandoned again would never re-enter the flow.
 */
export interface KlaviyoPlacedOrder {
  orderId: string;
  value: number;
  items: KlaviyoCheckoutLine[];
  couponCode?: string;
  discountValue?: number;
}

/**
 * Report a completed order — the trigger for the Thank You / post-purchase flow, and the
 * metric a Browse Abandonment or Abandoned Cart flow filters on to stop emailing a buyer.
 *
 * `$event_id` is the order id, deliberately: Klaviyo dedupes on it, so refreshing the
 * thank-you page or returning to it later cannot record the same order twice or re-enter the
 * flow. This is the opposite choice to `Started Checkout`, which needs a fresh id each time.
 */
export function trackPlacedOrder(order: KlaviyoPlacedOrder): void {
  const lines = order?.items ?? [];
  if (!order?.orderId || lines.length === 0) {
    return;
  }

  const categories = Array.from(new Set(lines.flatMap((line) => line.categories ?? [])));
  const brands = Array.from(new Set(lines.map((line) => line.brand).filter(Boolean)));

  const event: Record<string, unknown> = {
    $event_id: order.orderId,
    $value: order.value,
    OrderId: order.orderId,
    Categories: categories,
    ItemNames: lines.map((line) => line.productName),
    Brands: brands,
    Items: lines.map((line) => ({
      ProductID: line.productId,
      SKU: line.sku ?? '',
      ProductName: line.productName,
      Quantity: line.quantity,
      ItemPrice: line.price,
      RowTotal: line.price * line.quantity,
      ProductURL: line.productUrl ?? '',
      ImageURL: line.imageUrl ?? '',
      Categories: line.categories ?? [],
      Brand: line.brand ?? '',
    })),
  };
  if (order.couponCode) {
    event.DiscountCode = order.couponCode;
  }
  if (typeof order.discountValue === 'number' && order.discountValue > 0) {
    event.DiscountValue = order.discountValue;
  }

  push(['track', 'Placed Order', event]);
}

export function trackStartedCheckout(checkout: KlaviyoStartedCheckout): void {
  const lines = checkout?.items ?? [];
  if (lines.length === 0) {
    return;
  }

  const categories = Array.from(new Set(lines.flatMap((line) => line.categories ?? [])));

  push([
    'track',
    'Started Checkout',
    {
      $event_id: `${Date.now()}`,
      $value: checkout.value,
      ItemNames: lines.map((line) => line.productName),
      Categories: categories,
      CheckoutURL: checkout.checkoutUrl ?? '',
      Items: lines.map((line) => ({
        ProductID: line.productId,
        SKU: line.sku ?? '',
        ProductName: line.productName,
        Quantity: line.quantity,
        ItemPrice: line.price,
        RowTotal: line.price * line.quantity,
        ProductURL: line.productUrl ?? '',
        ImageURL: line.imageUrl ?? '',
        Categories: line.categories ?? [],
        Brand: line.brand ?? '',
      })),
    },
  ]);
}
