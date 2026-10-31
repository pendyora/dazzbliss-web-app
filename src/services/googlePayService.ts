import { encrypt } from '@/utils/enc-decy';

import ApiService from './ApiService';

/**
 * Price the cart for Google Pay without creating an order.
 * Fetched ahead of the click so the Google Pay sheet can open synchronously with the final total.
 */
export async function apiGetGooglePayQuote(data: any) {
  return ApiService.fetchData<any>({
    url: '/google-pay/quote',
    method: 'post',
    data: encrypt(data),
  });
}

/**
 * Start a Google Pay session on the backend.
 * Backend prices the cart server-side, creates a pending order, and returns the total that
 * the Google Pay sheet must display — so the buyer authorizes exactly what we charge.
 */
export async function apiCreateGooglePaySession(data: any) {
  return ApiService.fetchData<any>({
    url: '/google-pay/create-session',
    method: 'post',
    data: encrypt(data),
  });
}

/**
 * Hand the Google Pay wallet token to the backend.
 * Backend charges it through the existing Authorize.Net merchant account, confirms the order
 * and finalizes it (invoice, email, order items, stock deduction, etc.).
 */
export async function apiProcessGooglePayPayment(data: { order_id: string; payment_token: string; card_network?: string; card_last4?: string }) {
  return ApiService.fetchData<any>({
    url: '/google-pay/process-payment',
    method: 'post',
    data: encrypt(data),
  });
}

/**
 * Cancel a pending Google Pay order.
 * Called when the buyer dismisses the Google Pay sheet or the client-side flow fails before
 * the charge.
 */
export async function apiCancelGooglePayOrder(orderId: string) {
  return ApiService.fetchData<any>({
    url: `/google-pay/cancel-order/${orderId}`,
    method: 'post',
  });
}
