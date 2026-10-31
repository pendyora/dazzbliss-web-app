import { encrypt } from '@/utils/enc-decy';

import ApiService from './ApiService';

/**
 * Price the cart for Shop Pay without creating an order.
 * Fetched ahead of the click so the Shop Pay window can open synchronously with the final
 * `payment_request`, and to learn whether Shop Pay is configured (`shop_id`/`client_id`).
 */
export async function apiGetShopPayQuote(data: any) {
  return ApiService.fetchData<any>({
    url: '/shop-pay/quote',
    method: 'post',
    data: encrypt(data),
  });
}

/**
 * Start a Shop Pay session on the backend.
 * Backend re-prices the cart, creates a pending order and returns the Shopify session token
 * the SDK needs in `completeSessionRequest`.
 */
export async function apiCreateShopPaySession(data: any) {
  return ApiService.fetchData<any>({
    url: '/shop-pay/create-session',
    method: 'post',
    data: encrypt(data),
  });
}

/**
 * Submit the Shopify payment session for the pending order, with the card the buyer chose in
 * Shop Pay (`payment_method`). The addresses are the ones the
 * buyer confirmed inside Shop Pay (saved as our Address rows); omitted, the order keeps the
 * checkout's addresses.
 */
export async function apiSubmitShopPayPayment(data: {
  order_id: string;
  /** From `/create-session`. Required while the order has no user (always, from the cart) — else 403. */
  order_secret?: string | null;
  payment_method?: any;
  delivery_address?: string;
  billing_address?: string;
}) {
  return ApiService.fetchData<any>({
    url: '/shop-pay/submit-payment',
    method: 'post',
    data: encrypt(data),
  });
}

/**
 * Re-price the pending order with the discount codes entered in the Shop Pay window
 * (`ev.discountCodes`). Returns the updated `payment_request` and any `rejected_codes`.
 */
export async function apiApplyShopPayDiscount(data: { order_id: string; order_secret?: string | null; discount_codes: string[] }) {
  return ApiService.fetchData<any>({
    url: '/shop-pay/apply-discount',
    method: 'post',
    data: encrypt(data),
  });
}

/**
 * Confirm the payment and finalize the order.
 * Returns `{ processing: true }` while Shopify is still settling — callers poll.
 */
export async function apiConfirmShopPayPayment(data: { order_id: string }) {
  return ApiService.fetchData<any>({
    url: '/shop-pay/confirm-payment',
    method: 'post',
    data: encrypt(data),
  });
}

/** Cancel a pending Shop Pay order. Safe to call more than once. */
export async function apiCancelShopPayOrder(orderId: string, orderSecret?: string | null) {
  return ApiService.fetchData<any>({
    url: `/shop-pay/cancel-order/${orderId}`,
    method: 'post',
    // Anonymous cancels (no user on the order yet) are refused without the order's secret.
    data: encrypt({ order_secret: orderSecret }),
  });
}
