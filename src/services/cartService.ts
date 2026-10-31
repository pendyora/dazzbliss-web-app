import { normalizeCartLines } from '@/utils/cartLine';
import { resolveCloudflareTurnstileToken } from '@/utils/cloudflareTurnstile';
import { encrypt } from '@/utils/enc-decy';

import ApiService from './ApiService';

export async function apiAddToCart(data: any) {
  return ApiService.fetchData<any>({
    url: `/cart`,
    method: 'post',
    data: encrypt(normalizeCartLines(data)),
  });
}

export async function apiAddToCheckout(data: any) {
  return ApiService.fetchData<any>({
    url: `cart/checkout`,
    method: 'post',
    data: encrypt(normalizeCartLines(data)),
  });
}

export async function apiGetCartList() {
  return ApiService.fetchData({
    url: `/cart`,
    method: 'get',
  });
}
export async function apiGetLoalCartList(data: any) {
  return ApiService.fetchData<any>({
    url: `/cart/products/`,
    method: 'post',
    data: encrypt(normalizeCartLines(data)),
  });
}

export async function apiRemoveCart(id: any) {
  return ApiService.fetchData<any>({
    url: `/cart/${id}`,
    method: 'delete',
  });
}

export async function apiUpdateCountCartProduct(data: any) {
  return ApiService.fetchData<any>({
    url: `/cart/update-cart`,
    method: 'put',
    data: encrypt(normalizeCartLines(data)),
  });
}

// Partial update of a single cart line — used to edit ring size / engraving from the cart.
export async function apiUpdateCartItem(data: any) {
  return ApiService.fetchData<any>({
    url: `/cart/update-cart-item`,
    method: 'put',
    data: encrypt(data),
  });
}

export async function apiGetWishList(type: string) {
  return ApiService.fetchData<any>({
    url: `/wishlist?type=${type}`,
    method: 'get',
  });
}

export async function apiAddToWishList(data: any) {
  return ApiService.fetchData<any>({
    url: `/wishlist`,
    method: 'post',
    data: encrypt(data),
  });
}

export async function apiDeleteFromWishList(data: any) {
  // console.log(data);

  return ApiService.fetchData<any>({
    url: `/wishlist/delete-wishlist`,
    method: 'post',
    data: encrypt(data),
  });
}

export async function apiVerifyCoupon(data: any) {
  return ApiService.fetchData<any>({
    url: `/coupons/check-code`,
    method: 'post',
    data: encrypt(data),
  });
}
export async function getCouponData(id: any) {
  return ApiService.fetchData<any>({
    url: `/coupons/${id}`,
    method: 'get',
  });
}
export async function addSubmitSignUp(data: any) {
  return ApiService.fetchData<any>({
    url: `/user/subscribe`,
    method: 'post',
    data: encrypt({ ...data, cloudflareTurnstileToken: await resolveCloudflareTurnstileToken((data as any)?.cloudflareTurnstileToken) }),
  });
}

export async function varifyEmailApi(data: any) {
  return ApiService.fetchData<any>({
    url: `/user/verify-user`,
    method: 'post',
    data: encrypt({ ...data, cloudflareTurnstileToken: await resolveCloudflareTurnstileToken((data as any)?.cloudflareTurnstileToken) }),
  });
}

// Meta (Facebook/Instagram) Shops checkout: resolve catalog content ids (Meta content_id =
// StockManage.id) + quantities into validated, purchasable cart lines ({ jewelry_id, sku_master, count }).
export async function apiMetaResolveCart(data: { items: { content_id: string; count: number }[] }) {
  return ApiService.fetchData<any>({
    url: `/cart/meta-resolve`,
    method: 'post',
    data: encrypt(data),
  });
}

export async function apiMergeExistingCart(data: any) {
  return ApiService.fetchData<any>({
    url: `/cart/merge-existing`,
    method: 'post',
    data: encrypt({ ...data, cloudflareTurnstileToken: await resolveCloudflareTurnstileToken((data as any)?.cloudflareTurnstileToken) }),
  });
}
