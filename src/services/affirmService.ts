import { encrypt } from '@/utils/enc-decy';

import ApiService from './ApiService';

/**
 * Create an Affirm checkout via the backend.
 * Backend calculates the full order total server-side and returns the Affirm checkout data
 * for use with affirm.checkout() on the frontend.
 */
export async function apiCreateAffirmCheckout(data: any) {
  return ApiService.fetchData<any>({
    url: '/affirm/create-checkout',
    method: 'post',
    data: encrypt(data),
  });
}

/**
 * Capture an Affirm charge via the backend.
 * Called after user completes the Affirm modal and we receive the checkout_token.
 * Backend authorizes + captures the charge, verifies the amount, and finalizes the order.
 */
export async function apiCaptureAffirmCharge(data: { checkout_token: string; order_id: string }) {
  return ApiService.fetchData<any>({
    url: '/affirm/capture-charge',
    method: 'post',
    data: encrypt(data),
  });
}

/**
 * Report an Affirm failure on the shopper's side (white screen, validation error, script not
 * loading) so the backend can email the Ashclair inbox.
 */
export async function apiReportAffirmFailure(data: {
  stage: 'modal_not_opened' | 'validation_error' | 'sdk_failed_to_load' | 'sdk_not_available' | 'checkout_failed_before_modal';
  order_id?: string | null;
  error_message?: string | null;
  affirm_field?: string | null;
  http_status?: number | null;
  page_url?: string | null;
}) {
  return ApiService.fetchData<any>({
    url: '/affirm/report-failure',
    method: 'post',
    data: encrypt(data),
  });
}

/**
 * Cancel a pending Affirm order.
 * Called when user cancels the Affirm modal or payment fails on client side.
 */
export async function apiCancelAffirmOrder(orderId: string) {
  return ApiService.fetchData<any>({
    url: `/affirm/cancel-order/${orderId}`,
    method: 'post',
  });
}
