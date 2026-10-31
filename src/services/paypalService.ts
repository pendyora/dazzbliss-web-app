import { encrypt } from '@/utils/enc-decy';

import ApiService from './ApiService';

/**
 * Where the guest session is parked across the PayPal redirect.
 *
 * A guest's auth token lives in Redux at `cart.guestDetails.token`, and the `cart` slice is not
 * in the redux-persist whitelist — only `auth` is. Every other payment method authorizes inside
 * a popup, so the page never unloads. This flow navigates the whole tab to PayPal, which wipes
 * the store: without parking the token, a guest would come back from an approved payment and be
 * told they are not signed in.
 *
 * sessionStorage rather than localStorage: it is scoped to this tab and cleared when the tab
 * closes, which is the right lifetime for a token that only has to survive one round trip.
 */
const PAYPAL_GUEST_SESSION_KEY = 'paypal_guest_session';

/** Park the guest session immediately before navigating away to PayPal. */
export function stashPayPalGuestSession(guestDetails: any) {
  try {
    if (guestDetails?.token) {
      sessionStorage.setItem(PAYPAL_GUEST_SESSION_KEY, JSON.stringify(guestDetails));
    }
  } catch {
    // A blocked or full sessionStorage must not stop a logged-in buyer from paying.
  }
}

/** Read the parked guest session back on the return page. Returns null when there was none. */
export function readPayPalGuestSession(): any | null {
  try {
    const raw = sessionStorage.getItem(PAYPAL_GUEST_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Drop the parked guest session once the order is confirmed (or abandoned). */
export function clearPayPalGuestSession() {
  try {
    sessionStorage.removeItem(PAYPAL_GUEST_SESSION_KEY);
  } catch {
    // A stale entry is harmless and dies with the tab.
  }
}

/**
 * Legacy PayPal brokered through our Authorize.Net merchant account. Checkout and the cart
 * Express button now use the direct PayPal REST APIs further down; these remain only for the
 * `/paypal/return` page, which settles orders that were started on the old redirect flow.
 *
 * Step 1. Backend prices the cart, stores a pending order and opens a PayPal transaction on the
 * Authorize.Net merchant account, then returns the PayPal-hosted approval URL to redirect to.
 * Nothing is authorized until the buyer approves and the return page confirms.
 */
export async function apiCreatePayPalAuthorizeNetPayment(data: any) {
  return ApiService.fetchData<any>({
    url: '/paypal/authorize-net/create-payment',
    method: 'post',
    data: encrypt(data),
  });
}

/**
 * Step 2, called by the `/paypal/return` page. Backend reads the PayerID off the gateway, runs
 * the continue transaction (this is what actually authorizes the money), confirms the order and
 * finalizes it.
 *
 * Only `order_id` is sent: the PayerID in the return URL is buyer-controlled, so the backend
 * reads the authoritative one from Authorize.Net instead of trusting the query string.
 */
export async function apiConfirmPayPalAuthorizeNetPayment(orderId: string) {
  return ApiService.fetchData<any>({
    url: '/paypal/authorize-net/confirm-payment',
    method: 'post',
    data: encrypt({ order_id: orderId }),
  });
}

/**
 * Release a pending order after the buyer cancelled at PayPal.
 * Nothing was authorized, so there is no hold to void.
 */
export async function apiCancelPayPalAuthorizeNetOrder(orderId: string) {
  return ApiService.fetchData<any>({
    url: `/paypal/authorize-net/cancel-order/${orderId}`,
    method: 'post',
  });
}

/**
 * Create a PayPal order via the backend.
 * Backend calculates the full order total server-side and creates the PayPal order.
 */
export async function apiCreatePayPalOrder(data: any) {
  return ApiService.fetchData<any>({
    url: '/paypal/create-order',
    method: 'post',
    data: encrypt(data),
  });
}

/**
 * Capture a PayPal order via the backend.
 * Backend captures the payment, verifies the amount, and finalizes the order
 * (invoice, email, order items, stock deduction, etc.)
 */
export async function apiCapturePayPalOrder(orderId: string) {
  return ApiService.fetchData<any>({
    url: `/paypal/capture-order/${orderId}`,
    method: 'post',
  });
}

/**
 * Cancel a pending PayPal order.
 * Called when user cancels the PayPal popup or payment fails on client side.
 */
export async function apiCancelPayPalOrder(orderId: string) {
  return ApiService.fetchData<any>({
    url: `/paypal/cancel-order/${orderId}`,
    method: 'post',
  });
}

/**
 * Express Checkout — create a PayPal order directly from the Cart page (before any
 * sign-in / address). Backend prices the cart server-side and returns a PayPal order
 * with shipping_preference=GET_FROM_FILE so the buyer picks their address in the popup.
 * No DB order is created yet.
 */
export async function apiCreatePayPalExpressOrder(data: any) {
  return ApiService.fetchData<any>({
    url: '/paypal/express/create-order',
    method: 'post',
    data: encrypt(data),
  });
}

/**
 * Express Checkout — read back the buyer contact + shipping address PayPal collected in
 * the popup, used to prefill the confirmation form.
 */
export async function apiGetPayPalExpressOrderDetails(orderId: string) {
  return ApiService.fetchData<any>({
    url: `/paypal/express/order-details/${orderId}`,
    method: 'get',
  });
}

/**
 * Express Checkout — finalize an already-approved PayPal order. Requires real Address
 * records (delivery + billing) and an auth/guest token. Backend re-prices, captures,
 * verifies the amount and runs the shared finalization (order, items, stock, invoice...).
 */
export async function apiCapturePayPalExpressOrder(data: any) {
  return ApiService.fetchData<any>({
    url: '/paypal/express/capture-order',
    method: 'post',
    data: encrypt(data),
  });
}
