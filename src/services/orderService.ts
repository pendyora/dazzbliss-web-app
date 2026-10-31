import { resolveCloudflareTurnstileToken } from '@/utils/cloudflareTurnstile';
import { encrypt } from '@/utils/enc-decy';

import ApiService from './ApiService';

export async function apiPlaceOrder(data: any) {
  return ApiService.fetchData<any>({
    url: `/order/add`,
    method: 'post',
    data: encrypt(data),
  });
}

export async function apiGetOrders(id: any) {
  return ApiService.fetchData<any>({
    url: `/order/${id}`,
    method: 'get',
  });
}

// Meta (Facebook/Instagram) Shops attribution: tag the placed order as META and fire the
// server-side Conversions API Purchase (deduped with the browser Pixel via event_id = order_id).
export async function apiMetaOrderAttribution(data: {
  order_id: string;
  fbclid?: string;
  cart_origin?: string;
  capi_consent?: boolean;
  line_skus?: string[];
}) {
  return ApiService.fetchData<any>({
    url: `/order/meta-attribution`,
    method: 'post',
    data: encrypt(data),
  });
}
export async function getOrderList() {
  return ApiService.fetchData({
    url: `/order/list`,
    method: 'get',
  });
}

export async function apiRequestCustomJewelry<T>(data: any) {
  const formData = new FormData();

  // Extract image files
  const image_1 = data.image_1?.[0]?.originFileObj;
  const image_2 = data.image_2?.[0]?.originFileObj;
  const image_3 = data.image_3?.[0]?.originFileObj;

  // Remove file fields before encryption
  const { image_1: _, image_2: __, image_3: ___, ...textData } = data;

  // Append encrypted JSON data (with an auto Turnstile token embedded)
  formData.append(
    'data',
    encrypt({ ...textData, cloudflareTurnstileToken: await resolveCloudflareTurnstileToken((textData as any)?.cloudflareTurnstileToken) }, true),
  );
  // console.log(textData);

  // Append image files (optional)
  if (image_1) {
    formData.append('image_1', image_1);
  }
  if (image_2) {
    formData.append('image_2', image_2);
  }
  if (image_3) {
    formData.append('image_3', image_3);
  }

  // Call API
  return ApiService.fetchData<T>({
    url: '/jewelry/request-custom-jewelry',
    method: 'post',
    data: formData as any,
    headers: {
      'Content-Type': 'multipart/form-data', // Optional, sometimes inferred automatically
    },
  });
}

// ---- Customer cancel / return requests ----

// Eligibility and the order's requests come with the order itself (GET /order/:id →
// request_eligibility / order_requests), so there are no separate read calls.

export async function apiCreateOrderRequest(
  orderNumber: string,
  data: {
    request_type: number;
    items: { order_item_id: string; quantity: number; reason: string }[];
    comment?: string;
    policy_accepted: boolean;
  },
) {
  return ApiService.fetchData<any>({
    url: `/order/request/create/${orderNumber}`,
    method: 'post',
    data: encrypt(data),
  });
}

/** One endpoint for the customer's changes to their own request. */
async function apiUpdateOrderRequest(requestId: string, data: { action: 'withdraw' | 'tracking'; carrier?: string; tracking_number?: string }) {
  return ApiService.fetchData<any>({
    url: `/order/request/update/${requestId}`,
    method: 'post',
    data: encrypt(data),
  });
}

export async function apiWithdrawOrderRequest(requestId: string) {
  return apiUpdateOrderRequest(requestId, { action: 'withdraw' });
}

/** Customer tells us how the approved return was shipped back. */
export async function apiAddReturnTracking(requestId: string, data: { carrier: string; tracking_number: string }) {
  return apiUpdateOrderRequest(requestId, { action: 'tracking', ...data });
}
